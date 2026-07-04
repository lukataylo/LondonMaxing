// ─────────────────────────────────────────────────────────────────────────────
// Seed favorite spots — shared by the web mock (T1) and the server seed (T2/T4).
// Replace coords with locations near the hackathon venue before the demo.
// `curated: true` spots should have pre-generated story + audio (RESEARCH.md §4).
// ─────────────────────────────────────────────────────────────────────────────

import type { GhostSpot } from "./types.js";

export const SEED_SPOTS: GhostSpot[] = [
  {
    id: "dock-street-roastery",
    title: "Dock Street Roastery",
    lat: 51.5079,
    lng: -0.0877,
    unlockRadius: 40,
    icon: "coffee",
    seed: "a riverside cafe where dockworkers, writers, and students overlap",
    curated: true,
  },
  {
    id: "westminster-books",
    title: "Westminster Books",
    lat: 51.5074,
    lng: -0.1278,
    unlockRadius: 40,
    icon: "books",
    seed: "a pocket bookshop near Westminster with notes from every decade",
    curated: true,
  },
  {
    id: "south-bank-steps",
    title: "South Bank Steps",
    lat: 51.5033,
    lng: -0.1196,
    unlockRadius: 45,
    icon: "walk",
    seed: "a public stairway where performers, skaters, and night walkers leave traces",
    curated: true,
  },
  {
    id: "soho-listening-bar",
    title: "Soho Listening Bar",
    lat: 51.5155,
    lng: -0.1419,
    unlockRadius: 35,
    icon: "music",
    seed: "a late-night corner known for records, regulars, and half-remembered stories",
    curated: true,
  },
];

export function getSpot(id: string): GhostSpot | undefined {
  return SEED_SPOTS.find((s) => s.id === id);
}
