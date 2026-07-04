// Grudge Map content layer — public surface.
export * from "./types.js";
export * from "./stops.js";
export * from "./characters/index.js";
export * from "./prompt.js";
export * from "./session.js";
export * from "./portal.js";

import { STOPS } from "./stops.js";
import { stopToGhostSpot } from "./types.js";
import type { GhostSpot } from "../types.js";

/** All Dalston stops projected onto the map/proximity GhostSpot contract. */
export const GRUDGE_SPOTS: GhostSpot[] = STOPS.map(stopToGhostSpot);
