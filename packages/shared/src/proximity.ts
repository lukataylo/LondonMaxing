// ─────────────────────────────────────────────────────────────────────────────
// Proximity engine — the core gameplay primitive. Pure, dependency-free, shared
// by web (and reused inside the Expo WebView). Implements the lessons from
// RESEARCH.md §3: accuracy gate, smoothing, consecutive-fix debounce, hysteresis.
// NOTE: native geofencing is deliberately NOT used (it ignores radius / fires
// false events). We do our own distance check on every filtered fix.
// ─────────────────────────────────────────────────────────────────────────────

import type { Fix, GhostSpot, LatLng } from "./types.js";

export const DEFAULTS = {
  /** discard fixes worse than this (metres) */
  accuracyMaxM: 50,
  /** default unlock radius if a spot doesn't set one (metres) */
  unlockRadiusM: 40,
  /** must be beyond unlockRadius + this to re-lock (hysteresis, metres) */
  relockBufferM: 30,
  /** consecutive in-range fixes required to activate */
  neededHits: 3,
  /** ignore movement smaller than this between fixes (metres) — jitter floor */
  minMoveM: 4,
  /** smoothing factor for the rolling 1-D filter (0..1, higher = snappier) */
  smoothing: 0.4,
} as const;

/** Great-circle distance in metres. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type ProximityEvent =
  | { type: "activate"; spot: GhostSpot; distance: number }
  | { type: "deactivate"; spot: GhostSpot; distance: number }
  | { type: "position"; point: LatLng; raw: Fix };

type SpotState = { hits: number; active: boolean };

export type ProximityConfig = typeof DEFAULTS;

/**
 * Stateful engine. Feed it raw fixes via `onFix`; it emits activate/deactivate
 * events through the listener. Reuse one instance for the session.
 */
export class ProximityEngine {
  private cfg: ProximityConfig;
  private spots: GhostSpot[] = [];
  private state = new Map<string, SpotState>();
  private smoothed: LatLng | null = null;
  private listener: (e: ProximityEvent) => void;

  constructor(
    listener: (e: ProximityEvent) => void,
    cfg: Partial<ProximityConfig> = {}
  ) {
    this.listener = listener;
    this.cfg = { ...DEFAULTS, ...cfg };
  }

  setSpots(spots: GhostSpot[]) {
    this.spots = spots;
    for (const s of spots) {
      if (!this.state.has(s.id)) this.state.set(s.id, { hits: 0, active: false });
    }
  }

  /** Current smoothed position (after filtering), or null if no good fix yet. */
  get position(): LatLng | null {
    return this.smoothed;
  }

  /** Feed a raw fix (real or synthetic teleport). Returns the smoothed point or null if rejected. */
  onFix(fix: Fix): LatLng | null {
    // 1. accuracy gate — synthetic/teleport fixes bypass it
    if (!fix.synthetic && fix.accuracy > this.cfg.accuracyMaxM) return null;

    const incoming: LatLng = { lat: fix.lat, lng: fix.lng };

    // 2. smoothing (exponential moving average) + min-move jitter floor
    if (!this.smoothed || fix.synthetic) {
      this.smoothed = incoming;
    } else {
      const moved = haversineMeters(this.smoothed, incoming);
      if (moved < this.cfg.minMoveM) {
        this.listener({ type: "position", point: this.smoothed, raw: fix });
        return this.smoothed; // treat as noise, keep prior
      }
      const a = this.cfg.smoothing;
      this.smoothed = {
        lat: this.smoothed.lat + a * (incoming.lat - this.smoothed.lat),
        lng: this.smoothed.lng + a * (incoming.lng - this.smoothed.lng),
      };
    }

    this.listener({ type: "position", point: this.smoothed, raw: fix });
    this.evaluate(this.smoothed);
    return this.smoothed;
  }

  private evaluate(p: LatLng) {
    for (const s of this.spots) {
      const st = this.state.get(s.id)!;
      const radius = s.unlockRadius || this.cfg.unlockRadiusM;
      const d = haversineMeters(p, { lat: s.lat, lng: s.lng });

      if (!st.active) {
        // 3. debounce: require N consecutive in-range fixes
        if (d <= radius) {
          st.hits += 1;
          if (st.hits >= this.cfg.neededHits) {
            st.active = true;
            this.listener({ type: "activate", spot: s, distance: d });
          }
        } else {
          st.hits = 0;
        }
      } else {
        // 4. hysteresis: only re-lock once clearly outside
        if (d > radius + this.cfg.relockBufferM) {
          st.active = false;
          st.hits = 0;
          this.listener({ type: "deactivate", spot: s, distance: d });
        }
      }
    }
  }

  isActive(spotId: string): boolean {
    return this.state.get(spotId)?.active ?? false;
  }
}
