// ─────────────────────────────────────────────────────────────────────────────
// Old Haunts — the walk. A lean, self-contained screen (does NOT depend on the
// Old Haunts App.tsx): the Dalston loop on a plan map, GPS proximity via the shared
// ProximityEngine, a manual stop-advance debug control (PRD §9), camera-wake
// (PRD F2), the live voice conversation, and the accumulating grudge ledger (F6).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  ArrowRight as ArrowRightRaw,
  Camera as CameraRaw,
  CornerDownRight as CornerDownRightRaw,
  Images as ImagesRaw,
  Map as MapRaw,
  X as XRaw,
} from "lucide-react";
import {
  GRUDGE_SPOTS,
  ProximityEngine,
  STOPS_IN_ORDER,
  WALK_START,
  addEvent,
  addGrudge,
  getCharacterForStop,
  getFactPack,
  getStop,
  haversineMeters,
  newSession,
  type ClassifySubject,
  type GrudgeCharacter,
  type LatLng,
  type ProximityEvent,
  type Stop,
} from "@grudgemap/shared";
import { characterFromSubject } from "./adhocCharacter";
import {
  createMapboxMapRenderer,
  createPlanMapAdapter,
  type MapAdapter,
  type MapRenderer,
} from "../map/mapAdapter";
import { GrudgeConversation } from "./GrudgeConversation";
import { TimePortal } from "./TimePortal";
import { MemoriesCloud } from "./MemoriesCloud";
import "./GrudgeApp.css";

// lucide-react components typed for direct JSX use with size/strokeWidth.
type IconType = ComponentType<SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>;
const Icons = {
  arrow: ArrowRightRaw as unknown as IconType,
  camera: CameraRaw as unknown as IconType,
  close: XRaw as unknown as IconType,
  corner: CornerDownRightRaw as unknown as IconType,
  images: ImagesRaw as unknown as IconType,
  map: MapRaw as unknown as IconType,
};

/** Cropped photo-stickers (public/stickers/*.png) keyed by object class. */
const STICKER_BY_CLASS: Record<string, string> = {
  bollard: "bollard",
  postbox: "postbox",
  "ghost-sign": "ghostsign",
  shopfront: "market",
  ghost: "ghostsign",
};

function ObjectSticker({ cls, size }: { cls: string; size: number }) {
  const name = STICKER_BY_CLASS[cls] ?? "phonebox";
  return (
    <img
      className="gm-sticker"
      src={`/stickers/${name}.png`}
      alt=""
      style={{ width: size, height: size, objectFit: "contain" }}
      draggable={false}
    />
  );
}

const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string) || "";
const MAPBOX_STYLE = (import.meta.env.VITE_MAPBOX_STYLE as string) || "mapbox://styles/mapbox/light-v11";

export function GrudgeApp() {
  const [size, setSize] = useState({ width: 900, height: 720 });
  const [position, setPosition] = useState<LatLng>({ ...WALK_START });
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [selectedStopId, setSelectedStopId] = useState<string>(STOPS_IN_ORDER[0]?.id ?? "");
  const [session, setSession] = useState(() => newSession());
  const [convoStopId, setConvoStopId] = useState<string | null>(null);
  const [convoOverride, setConvoOverride] = useState<GrudgeCharacter | null>(null);
  const [portalOpen, setPortalOpen] = useState(false);
  const [memoriesOpen, setMemoriesOpen] = useState(false);
  const [navHeight, setNavHeight] = useState(120);
  const [status, setStatus] = useState("Standing outside Ramen Space, Dalston.");

  const navRef = useRef<HTMLElement | null>(null);

  const [mapboxAdapter, setMapboxAdapter] = useState<MapAdapter | null>(null);
  // Bumped whenever the Mapbox view moves so the absolutely-positioned pins
  // re-project against the live map.
  const [, setProjectionTick] = useState(0);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapboxContainerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<MapRenderer | null>(null);
  const engineRef = useRef<ProximityEngine | null>(null);

  const planAdapter = useMemo(() => createPlanMapAdapter(GRUDGE_SPOTS, size), [size]);
  const adapter = mapboxAdapter ?? planAdapter;
  const userPoint = adapter.project(position);
  const selectedStop = getStop(selectedStopId);
  const selectedChar = selectedStopId ? getCharacterForStop(selectedStopId) : undefined;

  // No lens filter any more — every haunt is on the map.
  const visibleSpots = GRUDGE_SPOTS;

  // The haunt the camera will rewind: whatever's selected, else the nearest one.
  const nearestStop = useMemo(() => {
    return [...STOPS_IN_ORDER].sort(
      (a, b) =>
        haversineMeters(position, { lat: a.lat, lng: a.lng }) -
        haversineMeters(position, { lat: b.lat, lng: b.lng }),
    )[0];
  }, [position]);
  const cameraStop = selectedStop ?? nearestStop;

  // ── Proximity engine (GPS) ─────────────────────────────────────────────────
  useEffect(() => {
    const engine = new ProximityEngine((event: ProximityEvent) => {
      if (event.type === "position") setPosition(event.point);
      if (event.type === "activate") {
        setActiveIds((ids) => new Set(ids).add(event.spot.id));
        setSelectedStopId(event.spot.id);
        setStatus(`Something woke up ${Math.round(event.distance)}m away.`);
      }
    });
    engine.setSpots(GRUDGE_SPOTS);
    engineRef.current = engine;
    engine.onFix({ ...WALK_START, accuracy: 12, synthetic: true, timestamp: Date.now() });

    let watchId: number | null = null;
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      const onGeo = (geo: GeolocationPosition) =>
        engine.onFix({
          lat: geo.coords.latitude,
          lng: geo.coords.longitude,
          accuracy: geo.coords.accuracy,
          timestamp: Date.now(),
        });
      navigator.geolocation.getCurrentPosition(onGeo, () =>
        setStatus("No GPS — use manual advance for the demo."), {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 2000,
      });
      // Continuous fixes so proximity can actually activate as you walk the loop.
      watchId = navigator.geolocation.watchPosition(onGeo, () => {}, {
        enableHighAccuracy: true,
        maximumAge: 2000,
      });
    }
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const node = mapRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setSize({
        width: Math.max(320, entry.contentRect.width),
        height: Math.max(360, entry.contentRect.height),
      });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Measure the bottom nav so the stop card always stacks directly above it,
  // whatever the nav's height (lens row wrapping, safe-area insets, etc.).
  useEffect(() => {
    const node = navRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => {
      // Border-box height (includes the nav's own padding) so the card stacks a
      // true gap above the whole nav — contentRect would omit the bottom padding
      // and let the card overlap the lens row.
      setNavHeight(node.getBoundingClientRect().height);
    });
    observer.observe(node);
    setNavHeight(node.getBoundingClientRect().height);
    return () => observer.disconnect();
  }, []);

  // ── Real Mapbox map (falls back to the plan map when no token) ───────────────
  useEffect(() => {
    const container = mapboxContainerRef.current;
    if (!container || !MAPBOX_TOKEN) return;
    let cancelled = false;
    let renderer: MapRenderer | null = null;
    try {
      renderer = createMapboxMapRenderer({
        accessToken: MAPBOX_TOKEN,
        center: WALK_START,
        container,
        onError: () => {
          renderer?.destroy();
          if (!cancelled) {
            rendererRef.current = null;
            setMapboxAdapter(null);
          }
        },
        onReady: () => {
          if (cancelled || !renderer) return;
          rendererRef.current = renderer;
          setMapboxAdapter(renderer.adapter);
          renderer.zoomBy(2); // tighten onto the ~300m Dalston loop
        },
        onViewChange: () => setProjectionTick((t) => t + 1),
        size,
        spots: GRUDGE_SPOTS,
        styleUrl: MAPBOX_STYLE,
      });
    } catch {
      setMapboxAdapter(null);
    }
    return () => {
      cancelled = true;
      renderer?.destroy();
      rendererRef.current = null;
      setMapboxAdapter(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    rendererRef.current?.resize();
  }, [size]);

  useEffect(() => {
    rendererRef.current?.setUserPosition(position);
  }, [position]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  function wakeStop(stop: Stop) {
    setActiveIds((ids) => new Set(ids).add(stop.id));
    setSelectedStopId(stop.id);
    setPosition({ lat: stop.lat, lng: stop.lng });
    setConvoOverride(null); // default to the stop's grounded character
    setConvoStopId(stop.id);
    setStatus(`${stop.name} is talking to you.`);
  }

  function advanceToNext() {
    // Manual stop-advance (PRD §9 mitigation for poor venue GPS).
    const currentOrder = getStop(selectedStopId)?.order ?? 0;
    const next =
      STOPS_IN_ORDER.find((s) => s.order > currentOrder && !session.visitedStops.includes(s.id)) ??
      STOPS_IN_ORDER.find((s) => !session.visitedStops.includes(s.id)) ??
      STOPS_IN_ORDER[0];
    if (next) wakeStop(next);
  }

  // Open the camera / rewind flow (center tab or the sheet's "Rewind it").
  function openCamera(stop?: Stop) {
    if (stop) setSelectedStopId(stop.id);
    setMemoriesOpen(false);
    setPortalOpen(true);
  }

  // Wake whatever the classifier found. A subject that matches the authored cast
  // (bollard/postbox/shopfront/ghost-sign) talks with its grounded fact pack;
  // anything else (a building, a road, a tree…) gets an ad-hoc persona.
  function wakeSubject(subject: ClassifySubject | null, stopId: string) {
    const stop = getStop(stopId);
    if (!stop) return;
    if (!subject) {
      wakeStop(stop);
      return;
    }
    const matches = STOPS_IN_ORDER.filter((s) => s.objectClass === subject.objectClass);
    if (matches.length > 0) {
      const near =
        [...matches].sort(
          (a, b) =>
            haversineMeters(position, { lat: a.lat, lng: a.lng }) -
            haversineMeters(position, { lat: b.lat, lng: b.lng }),
        )[0] ?? stop;
      wakeStop(near);
    } else {
      wakeStop(stop); // location context = nearest stop
      setConvoOverride(characterFromSubject(subject, stop.name)); // wins over wakeStop's reset
    }
  }

  // Record against the CONVERSATION's stop (not whatever pin is selected), since
  // logging fires ~1-2s after wake on the async voice connect.
  function recordGrudge(line: string) {
    const sid = convoStopId ?? selectedStopId;
    const cid = getCharacterForStop(sid)?.id ?? "the-bollard";
    setSession((s) => addGrudge(s, { characterId: cid, stopId: sid, line }));
  }
  function recordEvent(summary: string) {
    const sid = convoStopId ?? selectedStopId;
    const cid = getCharacterForStop(sid)?.id ?? "the-bollard";
    setSession((s) => addEvent(s, { stopId: sid, characterId: cid, summary }));
  }

  const convoStop = convoStopId ? getStop(convoStopId) : undefined;
  const convoChar = convoOverride ?? (convoStopId ? getCharacterForStop(convoStopId) : undefined);
  const convoPack = convoOverride
    ? undefined // ad-hoc persona: no fact pack, speaks from its nature
    : convoStop && convoChar
      ? getFactPack(convoChar.id, convoStop.id)
      : undefined;
  const selectedActive = selectedStopId ? activeIds.has(selectedStopId) : false;
  const activeTab = portalOpen ? "camera" : memoriesOpen ? "memories" : "map";

  return (
    <main className="app-shell gm-shell" style={{ ["--gm-nav-h" as string]: `${navHeight}px` }}>
      <section
        className={`map-stage ${mapboxAdapter ? "has-mapbox" : "has-plan-map"}`}
        ref={mapRef}
        aria-label="Old Haunts — Dalston loop"
      >
        <div className={`mapbox-layer ${mapboxAdapter ? "is-ready" : ""}`} ref={mapboxContainerRef} aria-hidden="true" />
        {!mapboxAdapter ? (
          <div className="plan-map">
            <div className="river" />
            <div className="map-label label-north">Dalston</div>
            <div className="map-label label-east">Ridley Road</div>
          </div>
        ) : null}

        {visibleSpots.map((spot) => {
          const p = adapter.project({ lat: spot.lat, lng: spot.lng });
          const stop = getStop(spot.id);
          const isActive = activeIds.has(spot.id);
          const isSelected = selectedStopId === spot.id;
          return (
            <button
              key={spot.id}
              className={`gm-pin ${isActive ? "is-active" : ""} ${isSelected ? "is-selected" : ""}`}
              style={{ left: `${p.x}px`, top: `${p.y}px` }}
              onClick={() => {
                setSelectedStopId(spot.id);
                setStatus(stop?.blurb ?? "");
              }}
              title={spot.title}
            >
              <span className="gm-pin-emoji"><ObjectSticker cls={spot.icon} size={30} /></span>
              <span className="gm-pin-order">{stop?.order}</span>
            </button>
          );
        })}

        <div className="user-dot" style={{ left: `${userPoint.x}px`, top: `${userPoint.y}px` }} aria-hidden="true" />

        <header className="topbar glass-panel gm-topbar">
          <div className="gm-brand">
            <span className="gm-brand-mark">👻</span>
            <span className="gm-brand-name">Old Haunts</span>
          </div>
          <div className="gm-status-chip">{status}</div>
        </header>
      </section>

      {/* ── Bottom sheet: the selected stop ────────────────────────────────── */}
      {selectedStop && selectedChar ? (
        <div className="gm-sheet glass-panel">
          <div className="gm-sheet-head">
            <span className="gm-sheet-emoji"><ObjectSticker cls={selectedStop.objectClass} size={36} /></span>
            <div className="gm-sheet-title">
              <strong>{selectedChar.name}</strong>
              <span>{selectedStop.name}</span>
            </div>
            <span className="gm-sheet-order">Stop {selectedStop.order}/6</span>
            <button
              className="gm-sheet-close"
              type="button"
              aria-label="Dismiss"
              onClick={() => setSelectedStopId("")}
            >
              <Icons.close size={17} strokeWidth={2} />
            </button>
          </div>
          <p className="gm-sheet-blurb">{selectedStop.blurb}</p>
          {selectedStop.walkToNext ? (
            <p className="gm-sheet-walk">
              <Icons.corner size={13} strokeWidth={1.8} /> {selectedStop.walkToNext}
            </p>
          ) : null}
          <div className="gm-sheet-actions">
            <button className="gm-btn gm-btn--primary" type="button" onClick={() => wakeStop(selectedStop)}>
              {selectedActive ? "Talk" : "Wake & talk"}
            </button>
            <button className="gm-btn gm-btn--icon" type="button" onClick={() => openCamera(selectedStop)}>
              <Icons.camera size={16} strokeWidth={1.8} /> Rewind it
            </button>
            <button className="gm-btn gm-btn--ghost gm-btn--icon" type="button" onClick={advanceToNext} title="Demo: jump to the next stop">
              Next stop <Icons.arrow size={15} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Live conversation ──────────────────────────────────────────────── */}
      {convoStop && convoChar ? (
        <GrudgeConversation
          key={`${convoStopId}:${convoOverride?.id ?? ""}`}
          character={convoChar}
          stop={convoStop}
          factPack={convoPack}
          memory={session}
          onGrudge={recordGrudge}
          onEvent={recordEvent}
          onClose={() => setConvoStopId(null)}
        />
      ) : null}

      {/* ── Camera → rewind → talk/read ────────────────────────────────────── */}
      {portalOpen ? (
        <TimePortal
          stop={cameraStop}
          onClose={() => setPortalOpen(false)}
          onTalk={(subject, stopId) => {
            setPortalOpen(false);
            wakeSubject(subject, stopId);
          }}
        />
      ) : null}

      {/* ── Memories ───────────────────────────────────────────────────────── */}
      {memoriesOpen ? <MemoriesCloud onClose={() => setMemoriesOpen(false)} /> : null}

      {/* ── Floating tab bar: Map · Camera (center) · Memories ──────────────── */}
      <nav className="gm-nav" ref={navRef} aria-label="Old Haunts navigation">
        <div className="gm-tabbar gm-tabbar--3">
          <button
            className={`gm-tab ${activeTab === "map" ? "is-active" : ""}`}
            type="button"
            onClick={() => {
              setPortalOpen(false);
              setMemoriesOpen(false);
            }}
          >
            <span className="gm-tab-ico"><Icons.map size={21} strokeWidth={1.8} /></span>
            <span>Map</span>
          </button>

          <button
            className={`gm-tab ${activeTab === "camera" ? "is-active" : ""}`}
            type="button"
            onClick={() => openCamera()}
          >
            <span className="gm-tab-ico"><Icons.camera size={21} strokeWidth={1.8} /></span>
            <span>Camera</span>
          </button>

          <button
            className={`gm-tab ${activeTab === "memories" ? "is-active" : ""}`}
            type="button"
            onClick={() => {
              setPortalOpen(false);
              setMemoriesOpen(true);
            }}
          >
            <span className="gm-tab-ico"><Icons.images size={21} strokeWidth={1.8} /></span>
            <span>Memories</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
