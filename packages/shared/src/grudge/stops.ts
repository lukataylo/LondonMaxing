// ─────────────────────────────────────────────────────────────────────────────
// The Dalston loop (PRD F1). Six pre-seeded stops on a short walk starting at
// Ramen Space, Bradbury Street / Gillett Square, Dalston (Londonmaxxing 003).
//
// The three MVP characters recur across the six stops — that recurrence is what
// makes the memory callbacks land ("that's the third Victorian thing you've
// ignored today", PRD demo 2:00). Ownership across the loop:
//   The Bollard  → stops 1, 4
//   The Postbox  → stops 2, 6
//   Edith        → stops 3, 5
//
// ⚠️ COORDINATES ARE APPROXIMATE, hand-placed around Dalston for the demo. They
// must be walked + corrected on the ground before the event (a task in
// content/AGENT_BRIEF.md). GPS indoors at the venue is poor, so the demo relies
// on the manual stop-advance control (PRD §9) rather than exact fences.
// ─────────────────────────────────────────────────────────────────────────────

import type { Stop } from "./types.js";

/** Ramen Space, Dalston — the walk's origin. */
export const WALK_START = { lat: 51.5473, lng: -0.0759 } as const;

export const STOPS: Stop[] = [
  {
    id: "gillett-square-bollard",
    order: 1,
    name: "The Gillett Square Bollard",
    lat: 51.5474,
    lng: -0.0757,
    unlockRadius: 30,
    characterId: "the-bollard",
    objectClass: "bollard",
    blurb: "A cast-iron bollard outside Ramen Space that has Opinions about being ignored.",
    walkToNext: "Head north to Kingsland High Street, by Dalston Kingsland station.",
  },
  {
    id: "kingsland-postbox",
    order: 2,
    name: "The Kingsland High Street Postbox",
    lat: 51.5486,
    lng: -0.0754,
    unlockRadius: 30,
    characterId: "the-postbox",
    objectClass: "postbox",
    blurb: "A Victorian VR-cipher pillar box that ranks itself above the church.",
    walkToNext: "Turn east into Ridley Road Market.",
  },
  {
    id: "ridley-road-market",
    order: 3,
    name: "Ridley Road Market",
    lat: 51.5482,
    lng: -0.0742,
    unlockRadius: 35,
    characterId: "edith",
    objectClass: "ghost-sign",
    blurb: "Edith haunts the market where she did her shopping in 1974. She has receipts.",
    walkToNext: "Cut back south-west toward Ashwin Street and the Eastern Curve Garden.",
  },
  {
    id: "ashwin-street-bollard",
    order: 4,
    name: "The Ashwin Street Bollard",
    lat: 51.5468,
    lng: -0.0766,
    unlockRadius: 30,
    characterId: "the-bollard",
    objectClass: "bollard",
    blurb: "A second bollard, by Café OTO, keeping a tally of everything you've walked past.",
    walkToNext: "Continue south to Dalston Lane.",
  },
  {
    id: "dalston-lane-coffee",
    order: 5,
    name: "Edith's Old Local (now a coffee shop)",
    lat: 51.5464,
    lng: -0.0741,
    unlockRadius: 30,
    characterId: "edith",
    objectClass: "shopfront",
    blurb: "Edith's pub is now a specialty coffee shop. She has priced the flat white.",
    walkToNext: "Finish at the Dalston Lane pillar box.",
  },
  {
    id: "dalston-lane-postbox",
    order: 6,
    name: "The Dalston Lane Pillar Box",
    lat: 51.5460,
    lng: -0.0728,
    unlockRadius: 30,
    characterId: "the-postbox",
    objectClass: "postbox",
    blurb: "The Postbox closes the loop, keeping a list of every Victorian thing you snubbed.",
    walkToNext: undefined,
  },
];

export function getStop(id: string): Stop | undefined {
  return STOPS.find((s) => s.id === id);
}

/** Stops in walk order, for the map + the demo's manual advance control. */
export const STOPS_IN_ORDER = [...STOPS].sort((a, b) => a.order - b.order);
