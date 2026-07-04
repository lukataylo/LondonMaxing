// ─────────────────────────────────────────────────────────────────────────────
// tourDirections.ts — Mapbox Directions API wrapper for walking routes.
//
// Exported as a standalone module so TourPlayer can fetch routes without
// coupling to the main App map adapter. Results are cached in memory by
// stop-coordinate fingerprint; the fallback is always a straight LineString
// so callers always receive a drawable path even when the API is unavailable.
//
// Mapbox Directions v5 limit: max 25 waypoints per request.
// ─────────────────────────────────────────────────────────────────────────────

type Coord = { lat: number; lng: number };

/** Minimal inline GeoJSON LineString — avoids needing @types/geojson. */
export type LineStringGeometry = {
  type: "LineString";
  coordinates: [number, number][];
};

/** In-memory cache keyed by a fingerprint of the stop coordinates. */
const routeCache = new Map<string, LineStringGeometry>();

function cacheKey(stops: Coord[]): string {
  return stops.map((s) => `${s.lng.toFixed(6)},${s.lat.toFixed(6)}`).join(";");
}

/** Straight-line fallback drawn through every stop in order. */
function straightLine(stops: Coord[]): LineStringGeometry {
  return {
    type: "LineString",
    coordinates: stops.map((s) => [s.lng, s.lat]),
  };
}

/**
 * Fetches a walking route from the Mapbox Directions API and returns the
 * GeoJSON LineString geometry (the `routes[0].geometry` field).
 *
 * On any network or API failure the function returns a straight-line
 * LineString through the ordered stops, so a path always renders.
 *
 * Only the first 25 stops are sent (Mapbox v5 limit).  Returns null when
 * fewer than 2 stops are given (no route to draw).
 */
export async function fetchWalkingRoute(
  stops: Coord[],
  token: string,
): Promise<LineStringGeometry | null> {
  if (stops.length < 2) return null;

  const key = cacheKey(stops);
  const cached = routeCache.get(key);
  if (cached !== undefined) return cached;

  // Mapbox format: lng,lat pairs separated by semicolons.
  // No URL-encoding needed — digits, ".", "-" and ";" are safe in path segments.
  const coordStr = stops
    .slice(0, 25)
    .map((s) => `${s.lng},${s.lat}`)
    .join(";");

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/walking/${coordStr}` +
    `?geometries=geojson&overview=full&access_token=${token}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Directions API returned HTTP ${res.status}`);
    }

    const data = (await res.json()) as {
      routes?: Array<{ geometry: LineStringGeometry }>;
      message?: string;
      code?: string;
    };

    if (!data.routes?.length) {
      throw new Error(
        data.message
          ? `${data.code ?? "NoRoute"}: ${data.message}`
          : "No routes returned from Directions API",
      );
    }

    const geometry = data.routes[0]!.geometry;
    routeCache.set(key, geometry);
    return geometry;
  } catch (err) {
    console.warn(
      "[tourDirections] Walking route unavailable — using straight-line fallback:",
      err,
    );
    const fallback = straightLine(stops);
    routeCache.set(key, fallback);
    return fallback;
  }
}
