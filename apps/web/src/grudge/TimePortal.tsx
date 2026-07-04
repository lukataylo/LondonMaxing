// ─────────────────────────────────────────────────────────────────────────────
// Time Portal (PRD: standalone module, wired here as a Old Haunts tab).
//
// Point the camera at a Dalston street, pick an era on the dial, tap capture.
// The frame re-renders in that era (grounded by the stop fact pack via
// /api/portal → Gemini image-to-image) and is revealed with an iris/crossfade
// wipe. A grounding caption cites real sources; export as a shareable postcard.
//
// If the render is slow/unavailable, a CSS era-filter "theatre" fallback keeps
// the interaction alive (PRD §7 fallback philosophy).
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ERAS,
  buildPortalCaption,
  getCharacterForStop,
  getEra,
  getFactPack,
  type EraId,
  type FactPack,
  type Stop,
} from "@grudgemap/shared";
import type { ClassifySubject } from "@grudgemap/shared";
import { fetchClassification, fetchDieCutSticker, fetchPortalRender } from "../api";
import { PORTAL_ASSETS } from "./portalAssets";
import { addMemory, updateMemorySticker } from "./memoryStore";
import { makeStickerFromPhoto } from "../sticker";
import "./TimePortal.css";

type Phase = "live" | "capturing" | "revealing" | "done";

export interface TimePortalProps {
  /** the nearest stop, used to ground the render + caption. */
  stop?: Stop;
  onClose: () => void;
  /** open the live voice conversation. The chosen subject (from vision) lets the
   *  app wake that specific thing — a known character or an ad-hoc persona. */
  onTalk?: (subject: ClassifySubject | null, stopId: string) => void;
}

/** Try to load an image; resolve its URL if it exists, else null. */
function tryLoadImage(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 1 ? url : null);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** A pre-rendered era image in public/portal/. Only requested when the manifest
 *  says it exists (no 404 noise), so it's instant + demo-safe. */
function cachedRenderFor(stopId: string, era: EraId): Promise<string | null> {
  if (!PORTAL_ASSETS.has(`${stopId}-${era}`)) return Promise.resolve(null);
  return tryLoadImage(`/portal/${stopId}-${era}.jpg`);
}

/** Downscale a data/blob URL to a JPEG thumbnail so stored memories stay small
 *  (full-res renders blow the ~5MB localStorage budget after a few snaps). */
function downscaleDataUrl(url: string, max = 720, quality = 0.8, mime = "image/jpeg"): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height, 1));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(url);
      try {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL(mime, quality));
      } catch {
        resolve(url); // cross-origin taint — keep original
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

export function TimePortal({ stop, onClose, onTalk }: TimePortalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [era, setEra] = useState<EraId>(ERAS[0]?.id ?? "1890s");
  const [phase, setPhase] = useState<Phase>("live");
  const [frameUrl, setFrameUrl] = useState<string | null>(null); // captured "now" frame
  const [renderUrl, setRenderUrl] = useState<string | null>(null); // era render
  const [caption, setCaption] = useState<{ lines: string[]; sources: string[] } | null>(null);
  const [grounded, setGrounded] = useState(true);
  const [note, setNote] = useState("");
  const [showRead, setShowRead] = useState(false);
  const [subjects, setSubjects] = useState<ClassifySubject[]>([]);
  const savedRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  // Always tear the camera down + cancel the reveal timer when we close, even if
  // the parent hides (rather than unmounts) this component.
  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }
  function handleClose() {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    stopStream();
    onClose();
  }

  const pack: FactPack | undefined = stop
    ? getFactPack(getCharacterForStop(stop.id)?.id ?? "the-bollard", stop.id)
    : undefined;
  const character = stop ? getCharacterForStop(stop.id) : undefined;
  const hasFacts = (pack?.facts.length ?? 0) > 0;
  const eraCard = getEra(era)!;

  // ── Camera ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setNote("No camera — capture uses a placeholder frame."));
    return () => {
      cancelled = true;
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  function grabFrame(): string {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const w = video?.videoWidth || 1080;
    const h = video?.videoHeight || 1440;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (ctx && video && video.videoWidth) {
      ctx.drawImage(video, 0, 0, w, h);
    } else if (ctx) {
      ctx.fillStyle = "#2b2b33";
      ctx.fillRect(0, 0, w, h);
    }
    return canvas.toDataURL("image/jpeg", 0.85);
  }

  // Compose a theatrical fallback: the captured frame under an era filter + tint.
  function makeTheatreRender(baseUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(baseUrl);
        ctx.filter = eraCard.cssFilter;
        ctx.drawImage(img, 0, 0);
        ctx.filter = "none";
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = eraCard.tint;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => resolve(baseUrl);
      img.src = baseUrl;
    });
  }

  const capture = useCallback(async () => {
    if (!hasFacts) {
      setNote("No verified history here — the dial is dark. Try a stop with a fact pack.");
      return;
    }
    const frame = grabFrame();
    setFrameUrl(frame);
    setPhase("capturing");
    setNote("");
    setSubjects([]);
    // Classify what's in shot in parallel with the rewind — identifies what to talk to.
    void fetchClassification(frame).then((r) => r?.subjects?.length && setSubjects(r.subjects));

    // Rewind, best-AND-fastest image first:
    // (1) instant pre-rendered period photo for this spot+era (demo-safe, no wait),
    // (2) live grounded OpenAI render of the actual frame,
    // (3) theatre era-tint fallback.
    const cached = stop ? await cachedRenderFor(stop.id, era) : null;
    const cap = buildPortalCaption(pack);
    let finalRender: string;
    if (cached) {
      finalRender = cached;
      setRenderUrl(cached);
      setCaption(cap);
      setGrounded(true);
    } else {
      const remote = await fetchPortalRender({
        imageBase64: frame,
        era,
        stopId: stop?.id,
        placeName: stop?.name,
      });
      if (remote) {
        finalRender = remote.imageUrl;
        setRenderUrl(remote.imageUrl);
        setCaption({ lines: remote.captionLines, sources: remote.sources });
        setGrounded(true);
      } else {
        const theatre = await makeTheatreRender(frame);
        finalRender = theatre;
        setRenderUrl(theatre);
        setCaption(cap);
        setGrounded(false);
        setNote("Live render unavailable — showing the era-tint reveal.");
      }
    }
    setPhase("revealing");
    void saveMemory(finalRender);
    timeoutRef.current = window.setTimeout(() => setPhase("done"), 1500); // let the wipe play
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [era, hasFacts, pack, stop]);

  // Bank the rewound moment as a Memory. The stored image is a downscaled JPEG
  // (not the full-res render) so localStorage doesn't fill after a few snaps.
  async function saveMemory(render: string) {
    if (!stop || savedRef.current) return;
    try {
      // JPEG thumbnail of the rewound scene for the lightbox…
      const photo = await downscaleDataUrl(render, 720, 0.8, "image/jpeg");
      // …and an INSTANT canvas die-cut sticker so Memories fills immediately.
      const canvasSticker = await makeStickerFromPhoto(photo, stop.name, photo);
      const mem = addMemory({
        spotId: stop.id,
        stickerUrl: canvasSticker,
        photoUrl: photo,
        caption: eraCard.label,
        lat: stop.lat,
        lng: stop.lng,
      });
      savedRef.current = true;
      // Background upgrade to a real gpt-image-2 die-cut (transparent white outline).
      // Guard against the mock provider's tiny 1×1 PNG (length check).
      void fetchDieCutSticker(render).then(async (raw) => {
        if (raw && raw.startsWith("data:image/png") && raw.length > 5000) {
          const better = await downscaleDataUrl(raw, 512, 1, "image/png");
          updateMemorySticker(mem.id, better);
        }
      });
    } catch {
      /* memory is best-effort */
    }
  }

  function reset() {
    setPhase("live");
    setFrameUrl(null);
    setRenderUrl(null);
    setCaption(null);
    setShowRead(false);
    setNote("");
    setGrounded(true);
    setSubjects([]);
    savedRef.current = false;
  }

  async function sharePostcard() {
    if (!renderUrl) return;
    try {
      const blob = await (await fetch(renderUrl)).blob();
      const file = new File([blob], `grudge-map-${era}.jpg`, { type: blob.type });
      const shareText = `${stop?.name ?? "A Dalston street"} in ${eraCard.label} — Old Haunts Time Portal.\n${caption?.lines.join(" ") ?? ""}\nSources: ${caption?.sources.join("; ") ?? "—"}`;
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Old Haunts · Time Portal", text: shareText });
        return;
      }
      const a = document.createElement("a");
      a.href = renderUrl;
      a.download = `grudge-map-${era}.jpg`;
      a.click();
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="tp-root" role="dialog" aria-label="Time Portal camera">
      {/* Live camera / captured frame layer */}
      <div className="tp-stage">
        <video ref={videoRef} autoPlay playsInline muted className={`tp-video ${phase === "live" ? "" : "is-hidden"}`} />
        {frameUrl ? <img src={frameUrl} alt="" className={`tp-frame ${phase === "done" ? "is-under" : ""}`} /> : null}
        {renderUrl ? (
          <img
            src={renderUrl}
            alt={`${stop?.name ?? "street"} rendered in ${eraCard.label}`}
            className={`tp-render tp-render--${phase}`}
          />
        ) : null}

        {phase === "capturing" ? (
          <div className="tp-iris">
            <div className="tp-iris-ring" style={{ borderColor: eraCard.tint }} />
            <p>Opening a window to {eraCard.label}…</p>
          </div>
        ) : null}

        {/* Grounding caption (PRD F4) */}
        {phase === "done" && caption ? (
          <div className="tp-caption">
            <span className="tp-caption-era" style={{ background: eraCard.tint }}>{eraCard.label}</span>
            {caption.lines.map((l, i) => (
              <p key={i} className="tp-caption-line">{l}</p>
            ))}
            {caption.sources.length ? (
              <p className="tp-caption-src">
                {grounded ? "Sources: " : "Grounded (theatre render) · Sources: "}
                {caption.sources.join(" · ")}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Top bar */}
      <div className="tp-top">
        <span className="tp-title">🕰️ Time Portal</span>
        <button className="tp-x" type="button" onClick={handleClose} aria-label="Close">✕</button>
      </div>
      {note ? <div className="tp-note">{note}</div> : null}

      {/* Read-about-it panel (grounded, no invented history) */}
      {showRead && stop ? (
        <div className="tp-read" role="dialog" aria-label={`About ${stop.name}`}>
          <div className="tp-read-card">
            <div className="tp-read-head">
              <strong>{character?.name ?? stop.name}</strong>
              <span>{stop.name}</span>
              <button className="tp-read-x" type="button" onClick={() => setShowRead(false)} aria-label="Close">✕</button>
            </div>
            <p className="tp-read-blurb">{stop.blurb}</p>
            <ul className="tp-read-facts">
              {(pack?.facts ?? []).slice(0, 6).map((f) => (
                <li key={f.id ?? f.text}>
                  {f.text}
                  {f.sourceUrl ? (
                    <a className="tp-read-src" href={f.sourceUrl} target="_blank" rel="noreferrer"> — {f.source}</a>
                  ) : (
                    <span className="tp-read-src"> — {f.source}</span>
                  )}
                </li>
              ))}
            </ul>
            {onTalk ? (
              <button className="tp-btn tp-btn--primary tp-read-talk" type="button" onClick={() => { setShowRead(false); onTalk(null, stop.id); handleClose(); }}>
                🎙️ Talk to it instead
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Bottom controls */}
      <div className="tp-controls">
        {phase === "done" ? (
          <>
            {subjects.length && onTalk && stop ? (
              <div className="tp-subjects">
                <p className="tp-subjects-h">Wake one up — what do you want to talk to?</p>
                <div className="tp-chips">
                  {subjects.map((s, i) => (
                    <button
                      key={i}
                      className="tp-chip"
                      type="button"
                      onClick={() => { onTalk(s, stop.id); handleClose(); }}
                    >
                      <span className="tp-chip-emoji">{s.emoji ?? "👻"}</span>
                      <span className="tp-chip-label">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="tp-act-row">
              {onTalk && stop && !subjects.length ? (
                <button className="tp-btn tp-btn--primary" type="button" onClick={() => { onTalk(null, stop.id); handleClose(); }}>
                  🎙️ Talk to it
                </button>
              ) : null}
              <button className="tp-btn" type="button" onClick={() => setShowRead(true)} disabled={!stop}>
                📖 Read about it
              </button>
            </div>
            <div className="tp-done-row">
              <button className="tp-btn tp-btn--ghost" type="button" onClick={reset}>↺ Again</button>
              <button className="tp-btn tp-btn--ghost" type="button" onClick={() => void sharePostcard()}>Save postcard</button>
            </div>
          </>
        ) : (
          <>
            <div className="tp-dial" role="tablist" aria-label="Era dial">
              {ERAS.map((e) => (
                <button
                  key={e.id}
                  role="tab"
                  aria-selected={era === e.id}
                  className={`tp-era ${era === e.id ? "is-active" : ""} ${hasFacts ? "" : "is-dark"}`}
                  style={era === e.id ? { borderColor: e.tint } : undefined}
                  onClick={() => setEra(e.id)}
                  disabled={!hasFacts}
                >
                  <strong>{e.label}</strong>
                  <span>{e.tagline}</span>
                </button>
              ))}
            </div>
            <button
              className="tp-shutter"
              type="button"
              onClick={() => void capture()}
              disabled={phase === "capturing" || !hasFacts}
              aria-label="Capture and re-render"
            >
              <span className="tp-shutter-ring" style={{ borderColor: eraCard.tint }} />
            </button>
            {!hasFacts ? (
              <div className="tp-nofacts-block">
                <p className="tp-nofacts">No verified history for this spot — the dial stays dark rather than invent it.</p>
                <div className="tp-act-row">
                  {onTalk && stop ? (
                    <button className="tp-btn tp-btn--primary" type="button" onClick={() => { onTalk(null, stop.id); handleClose(); }}>🎙️ Talk to it</button>
                  ) : null}
                  <button className="tp-btn tp-btn--ghost" type="button" onClick={handleClose}>Back to map</button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
