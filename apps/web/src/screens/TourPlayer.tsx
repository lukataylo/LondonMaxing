// ─────────────────────────────────────────────────────────────────────────────
// TourPlayer — full-screen glassmorphic player for the 10 pre-generated guided
// tours (TOURS / getTour from @grudgemap/shared).
//
// Two modes:
//   • LIST   — every tour as a card (title, guide, duration, stop count).
//   • PLAYER — two-pane: Mapbox GL map (top) + stop card (bottom).
//              The map shows a walking route through the stops and a numbered
//              marker overlay.  Tapping a marker selects that stop; Next/Prev
//              ease the map to the active stop.  fitBounds shows the full route
//              on first open.
//
// Map is only mounted in PLAYER mode.  Falls back gracefully when
// VITE_MAPBOX_ACCESS_TOKEN is absent (stop card still works without a map).
//
// NO lucide-react imports — inline SVG / unicode / emoji throughout.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { TOURS, getTour, type Tour, type TourStop } from "@grudgemap/shared";
import { fetchNarrationUrl } from "../api";
import { fetchWalkingRoute } from "../tourDirections";
import "./TourPlayer.css";

// ── Location-sticker inference ────────────────────────────────────────────────
// Stickers live at /pins/places/<kind>.png:
//   coffee, pub, bookshop, museum, church, monument, park, theatre, plaque, station
type StickerKind =
  | "coffee"
  | "pub"
  | "bookshop"
  | "museum"
  | "church"
  | "monument"
  | "park"
  | "theatre"
  | "plaque"
  | "station";

const KIND_RULES: Array<{ kind: StickerKind; re: RegExp }> = [
  { kind: "coffee", re: /coffee|caf[eé]|patisserie|bakery|espresso|tea\b|tearoom/i },
  { kind: "pub", re: /\bpub\b|tavern|\binn\b|arms|\blion\b|\bbar\b|alehouse|brewery/i },
  { kind: "bookshop", re: /book|library|reading room|press|stationer/i },
  { kind: "museum", re: /museum|gallery|exhibition|collection/i },
  { kind: "church", re: /church|cathedral|chapel|abbey|st\.?\s|saint|minster/i },
  { kind: "theatre", re: /theatre|theater|playhouse|opera|hall\b|cinema|club\b/i },
  { kind: "station", re: /station|underground|tube|railway|terminus|platform/i },
  { kind: "park", re: /park|square|garden|green|heath|common|fields?\b/i },
  { kind: "monument", re: /monument|column|statue|memorial|arch\b|obelisk|fountain|tomb|grave/i },
];

function inferStickerKind(stop: TourStop): StickerKind | null {
  const haystack = `${stop.name} ${stop.partner?.venue ?? ""} ${stop.blurb}`;
  for (const rule of KIND_RULES) {
    if (rule.re.test(haystack)) return rule.kind;
  }
  // Plaque is a sensible default for an otherwise-unclassified historic marker.
  return stop.kind === "historic" ? "plaque" : null;
}

const FALLBACK_EMOJI = "📍";

// ── Inline icons ──────────────────────────────────────────────────────────────

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
function IconSpeaker() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M16 8.5a4 4 0 0 1 0 7" />
      <path d="M18.5 6a7.5 7.5 0 0 1 0 12" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function IconPause() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
      <path d="M7 5l12 7-12 7V5z" />
    </svg>
  );
}
function IconWalk() {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="4" r="2" />
      <path d="M11 8l-2 5 3 2 1 5M11 8l4 2 3-1M9 13l-3 2-1 4" />
    </svg>
  );
}

// ── Guide avatar with initials fallback ──────────────────────────────────────
// Warm amber palette — one colour per guide, stable via guide-ID char hash.
const AVATAR_BG_PALETTE = [
  "#b85e28", "#7a4c38", "#3d6b8a", "#6b4fa0",
  "#2e7a4a", "#8a3a3a", "#5a5a20", "#2a6b6b",
];

function getAvatarBg(guideId: string): string {
  const hash = guideId
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_BG_PALETTE[hash % AVATAR_BG_PALETTE.length] ?? "#7a4c38";
}

function guideInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (w[0] ?? "").toUpperCase())
    .join("");
}

function GuideAvatar({ guideId, guideName }: { guideId: string; guideName: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        className="tp-guide-avatar-initials"
        style={{ background: getAvatarBg(guideId) }}
        aria-hidden="true"
      >
        {guideInitials(guideName)}
      </span>
    );
  }
  return (
    <img
      src={`/pins/${guideId}.png`}
      alt=""
      draggable={false}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

function partnerStopCount(tour: Tour): number {
  return tour.stops.filter((s) => s.kind === "partner").length;
}

// ── Stop icon (used in the stop card, not the map marker) ────────────────────

function StopIcon({ stop }: { stop: TourStop }) {
  const kind = inferStickerKind(stop);
  const [failed, setFailed] = useState(false);
  if (!kind || failed) {
    return <span className="tp-stop-emoji" aria-hidden="true">{FALLBACK_EMOJI}</span>;
  }
  return (
    <img
      className="tp-stop-sticker"
      src={`/pins/places/${kind}.png`}
      alt=""
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

// ── Map marker DOM helpers ────────────────────────────────────────────────────
// Markers are plain DOM elements (not React) because mapboxgl.Marker owns them.

function createStopMarkerEl(
  stop: TourStop,
  index: number,
  currentIndex: number,
): HTMLDivElement {
  const kind = inferStickerKind(stop) ?? "plaque";
  const isCurrent = index === currentIndex;
  const isPast = index < currentIndex;

  const outer = document.createElement("div");
  outer.className = "tp-map-marker";
  if (isCurrent) outer.style.zIndex = "10";

  const inner = document.createElement("div");
  inner.className =
    "tp-map-marker-inner" +
    (isCurrent ? " is-current" : isPast ? " is-past" : "");

  const img = document.createElement("img");
  img.src = `/pins/places/${kind}.png`;
  img.alt = "";
  img.onerror = () => {
    img.style.display = "none";
  };

  const num = document.createElement("span");
  num.className = "tp-map-marker-num";
  num.textContent = String(index + 1);

  inner.appendChild(img);
  inner.appendChild(num);
  outer.appendChild(inner);

  return outer;
}

function updateStopMarkerEl(
  el: HTMLElement,
  index: number,
  currentIndex: number,
): void {
  const isCurrent = index === currentIndex;
  const isPast = index < currentIndex;

  el.style.zIndex = isCurrent ? "10" : "";

  const inner = el.querySelector(".tp-map-marker-inner");
  if (!inner) return;
  inner.className =
    "tp-map-marker-inner" +
    (isCurrent ? " is-current" : isPast ? " is-past" : "");
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TourPlayer({
  onClose,
  initialTourId,
}: {
  onClose: () => void;
  initialTourId?: string;
}) {
  const [selectedTourId, setSelectedTourId] = useState<string | null>(initialTourId ?? null);
  const [stopIndex, setStopIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [paused, setPaused] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  // Bumped on every narrate/stop so stale async callbacks no-op (no restart loop).
  const narrationTokenRef = useRef(0);

  // Map refs — only used in PLAYER mode
  const tourMapContainerRef = useRef<HTMLDivElement | null>(null);
  const tourMapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const tourMarkersRef = useRef<mapboxgl.Marker[]>([]);
  // Tracks current stopIndex inside async callbacks (avoids stale closure).
  const stopIndexRef = useRef(stopIndex);
  stopIndexRef.current = stopIndex;

  const tour = selectedTourId ? getTour(selectedTourId) : undefined;

  function stopNarration() {
    narrationTokenRef.current++;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      try { audioRef.current.currentTime = 0; } catch { /* ignore */ }
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setIsPlaying(false);
    setPaused(false);
  }

  function pauseNarration() {
    if (audioRef.current && !audioRef.current.paused) audioRef.current.pause();
    if ("speechSynthesis" in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
    setPaused(true);
  }

  function resumeNarration() {
    if (audioRef.current) void audioRef.current.play().catch(() => {});
    if ("speechSynthesis" in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    setPaused(false);
  }

  function toggleNarrationPause() {
    if (paused) resumeNarration();
    else pauseNarration();
  }

  // Stop any audio when the tour, stop, or component changes.
  useEffect(() => stopNarration, []);
  useEffect(() => {
    stopNarration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTourId, stopIndex]);

  // ── Mapbox map: mount/destroy when the active tour changes ────────────────
  useEffect(() => {
    const container = tourMapContainerRef.current;
    const rawToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    const token =
      typeof rawToken === "string" && rawToken.trim() ? rawToken.trim() : "";

    if (!tour || !container || !token) return;

    // Tear down any map left from a previous tour.
    tourMarkersRef.current.forEach((m) => m.remove());
    tourMarkersRef.current = [];
    tourMapInstanceRef.current?.remove();
    tourMapInstanceRef.current = null;

    mapboxgl.accessToken = token;

    const firstStop = tour.stops[0];
    if (!firstStop) return;

    const map = new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/light-v11",
      center: [firstStop.lng, firstStop.lat],
      zoom: 14,
      attributionControl: false,
      pitchWithRotate: false,
      scrollZoom: true,
    });

    tourMapInstanceRef.current = map;
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    // Guard flag so the async load callback ignores a destroyed map.
    let alive = true;

    map.on("load", async () => {
      if (!alive || tourMapInstanceRef.current !== map) return;

      // 1. fitBounds to the whole route.
      if (tour.stops.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        tour.stops.forEach((s) => bounds.extend([s.lng, s.lat]));
        map.fitBounds(bounds, {
          padding: { top: 48, bottom: 48, left: 36, right: 36 },
          duration: 700,
          maxZoom: 16,
        });
      } else {
        map.flyTo({
          center: [firstStop.lng, firstStop.lat],
          zoom: 15,
          duration: 0,
        });
      }

      // 2. Fetch walking route and draw it.
      const geometry = await fetchWalkingRoute(
        tour.stops.map((s) => ({ lat: s.lat, lng: s.lng })),
        token,
      );

      if (!alive || tourMapInstanceRef.current !== map) return;

      if (geometry && !map.getSource("tour-route")) {
        map.addSource("tour-route", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry },
        });

        // White casing for contrast against the map background.
        map.addLayer({
          id: "tour-route-casing",
          type: "line",
          source: "tour-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#ffffff", "line-width": 7 },
        });

        // Accent walking line on top.
        map.addLayer({
          id: "tour-route-line",
          type: "line",
          source: "tour-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#f4761f",
            "line-width": 4,
            "line-dasharray": [1, 2.5],
          },
        });
      }

      if (!alive || tourMapInstanceRef.current !== map) return;

      // 3. Add a numbered marker for each stop.
      const currentIdx = stopIndexRef.current;
      const markers: mapboxgl.Marker[] = [];

      tour.stops.forEach((stop, i) => {
        const el = createStopMarkerEl(stop, i, currentIdx);
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setStopIndex(i);
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([stop.lng, stop.lat])
          .addTo(map);

        markers.push(marker);
      });

      tourMarkersRef.current = markers;
    });

    map.on("error", (ev) => {
      console.warn("[TourPlayer] Mapbox error:", ev.error);
    });

    return () => {
      alive = false;
      tourMarkersRef.current.forEach((m) => m.remove());
      tourMarkersRef.current = [];
      map.remove();
      if (tourMapInstanceRef.current === map) {
        tourMapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour?.id]);

  // ── Mapbox: update markers + easeTo when the active stop changes ──────────
  useEffect(() => {
    const map = tourMapInstanceRef.current;
    if (!map || !tour) return;

    // Refresh marker visual states (current / past / future).
    tourMarkersRef.current.forEach((marker, i) => {
      updateStopMarkerEl(marker.getElement(), i, stopIndex);
    });

    // Ease to the active stop (only after initial fitBounds has run).
    const activeStop = tour.stops[stopIndex];
    if (activeStop && map.loaded()) {
      map.easeTo({
        center: [activeStop.lng, activeStop.lat],
        zoom: Math.max(map.getZoom(), 15),
        duration: 550,
        essential: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopIndex, tour?.id]);

  function openTour(id: string) {
    setSelectedTourId(id);
    setStopIndex(0);
  }

  function backToList() {
    stopNarration();
    setSelectedTourId(null);
    setStopIndex(0);
  }

  function speakBrowser(text: string, token: number) {
    if (!("speechSynthesis" in window) || token !== narrationTokenRef.current) {
      setIsPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    utterance.onend = () => {
      if (token === narrationTokenRef.current) { setIsPlaying(false); setPaused(false); }
    };
    utterance.onerror = () => {
      if (token === narrationTokenRef.current) { setIsPlaying(false); setPaused(false); }
    };
    setIsPlaying(true);
    setPaused(false);
    window.speechSynthesis.speak(utterance);
  }

  async function narrate(stop: TourStop, guideId: string) {
    stopNarration();
    const token = ++narrationTokenRef.current;
    setIsPlaying(true);
    setPaused(false);
    if ("speechSynthesis" in window) {
      try { window.speechSynthesis.getVoices(); } catch { /* ignore */ }
    }
    const url = await fetchNarrationUrl({ text: stop.narration, spotId: guideId });
    if (token !== narrationTokenRef.current) {
      if (url) URL.revokeObjectURL(url);
      return;
    }
    if (url) {
      objectUrlRef.current = url;
      // Reuse the persistent (gesture-unlocked) element so play() works on mobile/PWA.
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.muted = false;
      audio.src = url;
      try { audio.currentTime = 0; } catch { /* ignore */ }
      let fellBack = false;
      audio.onended = () => {
        if (token !== narrationTokenRef.current) return;
        setIsPlaying(false);
        setPaused(false);
      };
      audio.onerror = () => {
        if (fellBack || token !== narrationTokenRef.current) return;
        if (audio.currentTime > 0 || !audio.paused) return;
        fellBack = true;
        speakBrowser(stop.narration, token);
      };
      try {
        await audio.play();
        return;
      } catch {
        if (!fellBack && token === narrationTokenRef.current) {
          fellBack = true;
          speakBrowser(stop.narration, token);
        }
        return;
      }
    }
    speakBrowser(stop.narration, token);
  }

  // ── LIST view ────────────────────────────────────────────────────────────
  if (!tour) {
    return (
      <div className="tour-player" role="dialog" aria-label="Guided tours">
        <header className="tp-header glass-panel">
          <div className="tp-header-titles">
            <p className="tp-eyebrow">Guided walks</p>
            <h1 className="tp-title">Tours of historic London</h1>
          </div>
          <button className="tp-close" type="button" onClick={onClose} aria-label="Close tours">
            <IconClose />
          </button>
        </header>

        <div className="tp-scroll">
          <ul className="tp-list">
            {TOURS.map((t) => {
              const partners = partnerStopCount(t);
              return (
                <li key={t.id}>
                  <button className="tp-card glass-panel" type="button" onClick={() => openTour(t.id)}>
                    <div className="tp-card-head">
                      <span className="tp-guide-avatar">
                        <GuideAvatar guideId={t.guideId} guideName={t.guideName} />
                      </span>
                      <div className="tp-card-titles">
                        <h2>{t.title}</h2>
                        <p className="tp-card-guide">with {t.guideName}</p>
                      </div>
                    </div>
                    <p className="tp-card-summary">{t.summary}</p>
                    <div className="tp-card-meta">
                      <span>{t.durationMin} min</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatDistance(t.distanceM)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{t.stops.length} stops</span>
                      {partners > 0 ? <span className="tp-partner-pill">{partners} partner</span> : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  // ── PLAYER view ──────────────────────────────────────────────────────────
  const total = tour.stops.length;
  const stop = tour.stops[Math.min(stopIndex, total - 1)];
  if (!stop) return null;
  const isPartner = stop.kind === "partner";

  return (
    <div className="tour-player" role="dialog" aria-label={`${tour.title} guided tour`}>
      <header className="tp-header glass-panel">
        <button className="tp-back" type="button" onClick={backToList} aria-label="Back to tour list">
          <IconChevronLeft />
          <span>Tours</span>
        </button>
        <div className="tp-header-titles">
          <p className="tp-eyebrow">{tour.guideName}</p>
          <h1 className="tp-title tp-title-sm">{tour.title}</h1>
        </div>
        <button className="tp-close" type="button" onClick={onClose} aria-label="Close tours">
          <IconClose />
        </button>
      </header>

      {/* ── Map pane ── */}
      <div className="tp-map-pane" aria-hidden="true">
        <div ref={tourMapContainerRef} className="tp-mapbox-container" />
      </div>

      {/* ── Stop card + dots ── */}
      <div className="tp-scroll">
        <section className="tp-stop glass-panel">
          <div className="tp-stop-head">
            <span className={`tp-stop-icon ${isPartner ? "is-partner" : ""}`}>
              <StopIcon stop={stop} />
            </span>
            <div className="tp-stop-titles">
              <p className="tp-progress">Stop {stopIndex + 1} of {total}</p>
              <h2>{stop.name}</h2>
              <p className="tp-stop-blurb">{stop.blurb}</p>
            </div>
          </div>

          {isPartner && stop.partner ? (
            <div className="tp-partner-card">
              <span className="tp-partner-badge">Partner stop</span>
              <strong>{stop.partner.venue}</strong>
              {stop.partner.offer ? <p>{stop.partner.offer}</p> : null}
            </div>
          ) : null}

          <p className="tp-narration">{stop.narration}</p>

          {isPlaying ? (
            <div className="tp-narrate-row">
              <button
                className="tp-narrate tp-narrate-toggle"
                type="button"
                onClick={toggleNarrationPause}
                aria-label={paused ? "Resume narration" : "Pause narration"}
              >
                {paused ? <IconPlay /> : <IconPause />}
                {paused ? "Resume" : "Pause"}
              </button>
              <button
                className="tp-narrate tp-narrate-restart"
                type="button"
                onClick={() => narrate(stop, tour.guideId)}
                aria-label="Restart narration"
              >
                <IconSpeaker />
                Restart
              </button>
            </div>
          ) : (
            <button
              className="tp-narrate"
              type="button"
              onClick={() => narrate(stop, tour.guideId)}
            >
              <IconSpeaker />
              Narrate
            </button>
          )}

          {stop.walkToNext ? (
            <p className="tp-walk">
              <IconWalk />
              <span>{stop.walkToNext}</span>
            </p>
          ) : (
            <p className="tp-walk tp-walk-end">
              <span>Final stop — end of the walk.</span>
            </p>
          )}
        </section>

        <ol className="tp-dots" aria-hidden="true">
          {tour.stops.map((s, i) => (
            <li key={s.id} className={i === stopIndex ? "is-current" : i < stopIndex ? "is-done" : ""} />
          ))}
        </ol>
      </div>

      <footer className="tp-nav glass-panel">
        <button
          className="tp-nav-btn"
          type="button"
          disabled={stopIndex === 0}
          onClick={() => setStopIndex((i) => Math.max(0, i - 1))}
        >
          <IconChevronLeft />
          Prev
        </button>
        <span className="tp-nav-count">{stopIndex + 1} / {total}</span>
        {stopIndex >= total - 1 ? (
          <button
            className="tp-nav-btn tp-nav-next tp-nav-finish"
            type="button"
            onClick={() => {
              stopNarration();
              onClose();
            }}
          >
            Finish
            <IconCheck />
          </button>
        ) : (
          <button
            className="tp-nav-btn tp-nav-next"
            type="button"
            onClick={() => setStopIndex((i) => Math.min(total - 1, i + 1))}
          >
            Next
            <IconChevronRight />
          </button>
        )}
      </footer>
    </div>
  );
}
