// ─────────────────────────────────────────────────────────────────────────────
// Session memory + the grudge ledger (PRD F4, F6).
//
// Pure, dependency-free helpers. The web app keeps one SessionMemory for the
// walk, injects it into each conversation's system prompt (so characters call
// back), and renders `grudges` as the visible, shareable ledger.
// ─────────────────────────────────────────────────────────────────────────────

import type { Grudge, SessionEvent, SessionMemory } from "./types.js";
import { EMPTY_SESSION } from "./types.js";

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

/** Record that the visitor reached a stop / had an exchange there. */
export function addEvent(
  memory: SessionMemory,
  event: Omit<SessionEvent, "ts">,
): SessionMemory {
  return {
    ...memory,
    visitedStops: memory.visitedStops.includes(event.stopId)
      ? memory.visitedStops
      : [...memory.visitedStops, event.stopId],
    events: [...memory.events, { ...event, ts: Date.now() }],
  };
}

/** Add one accumulated grievance to the ledger. */
export function addGrudge(
  memory: SessionMemory,
  grudge: Omit<Grudge, "id" | "ts">,
): SessionMemory {
  return {
    ...memory,
    grudges: [...memory.grudges, { ...grudge, id: nextId("grudge"), ts: Date.now() }],
  };
}

export function newSession(): SessionMemory {
  return { ...EMPTY_SESSION, visitedStops: [], events: [], grudges: [] };
}

/** How many distinct things the visitor has been grumbled at about. */
export function grudgeCount(memory: SessionMemory): number {
  return memory.grudges.length;
}
