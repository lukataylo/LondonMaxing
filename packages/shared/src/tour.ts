// ─────────────────────────────────────────────────────────────────────────────
// Guided-tour contract. A historical figure walks you through a themed sequence
// of real London stops, narrating each in their own voice. Some stops are
// "partner" venues (cafés/pubs/shops) — the monetizable inventory: sponsorable
// pauses woven into the route. Tour content is PRE-GENERATED (authored ahead),
// not produced live, so it's reliable on stage.
// ─────────────────────────────────────────────────────────────────────────────

export type TourStopKind = "historic" | "partner";

export type TourStop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind: TourStopKind;
  /** short card label, ~6-12 words */
  blurb: string;
  /** 40-90 words, FIRST PERSON in the guide's voice, grounded in this exact place */
  narration: string;
  /** walking directions to the next stop, e.g. "120m east along Dean Street" */
  walkToNext?: string;
  /** present for kind:"partner" — a real-ish venue we could charge to feature */
  partner?: { venue: string; offer?: string };
};

export type Tour = {
  id: string;
  /** character id this guide maps to where one exists (e.g. "karl-marx") */
  guideId: string;
  guideName: string;
  /** evocative title, e.g. "Marx's Soho: Exile & Revolution" */
  title: string;
  /** one-line hook */
  summary: string;
  durationMin: number;
  distanceM: number;
  /** ElevenLabs voice description for the guide */
  voiceHint: string;
  /** 4-10 ordered stops forming a walkable narrative arc */
  stops: TourStop[];
};

export function tourStart(tour: Tour): TourStop | undefined {
  return tour.stops[0];
}
