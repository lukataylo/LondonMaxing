// ─────────────────────────────────────────────────────────────────────────────
// Grudge Map — domain model.
//
// London's street furniture and dead locals talk to you as you walk. They
// remember you, they hold grudges, and everything they say is grounded in real
// history (a per-stop "fact pack" — see PRD F5).
//
// This file is the FROZEN contract for the content layer. The actual character
// backgrounds + verified fact packs are authored in
// packages/shared/src/grudge/characters/<id>.ts by a content agent following
// content/AGENT_BRIEF.md — everything here just types that work so it drops in.
// ─────────────────────────────────────────────────────────────────────────────

import type { GhostSpot } from "../types.js";

/** MVP cast (PRD §5). Extendable — the content pipeline generalises. */
export type GrudgeCharacterId = "the-bollard" | "edith" | "the-postbox";

/**
 * What the on-device camera classifier must see to WAKE a character (PRD F2).
 * "ghost" characters have no physical object and wake on GPS / a ghost sign.
 */
export type ObjectClass = "bollard" | "postbox" | "ghost-sign" | "shopfront" | "ghost";

export type CharacterType = "street-furniture" | "ghost";

/** Where a fact came from — every spoken line must trace to one (PRD §10). */
export type FactSourceKind =
  | "historic-england" // listing / NHLE entry
  | "blue-plaque"
  | "wikidata"
  | "archive" // Hackney Archives, newspaper, photo archive
  | "local-press"
  | "other";

/** One verifiable historical fact a character is allowed to use. */
export interface Fact {
  id: string;
  /** The fact itself, tight and speakable. */
  text: string;
  /** Human-readable provenance, e.g. "Historic England NHLE 1391145". */
  source: string;
  sourceKind: FactSourceKind;
  sourceUrl?: string;
  /** optional dating, e.g. "1817" or "1970s". */
  era?: string;
}

/** A named present-day local reference — the punchline material (PRD §5). */
export interface LocalReference {
  /** e.g. "Ridley Road Market", "a £4.50 oat flat white", "Café OTO". */
  name: string;
  /** why it's funny / how the character uses it. */
  angle?: string;
}

/**
 * Everything a character may draw on at ONE stop. Characters can ONLY use facts
 * from their pack — no parametric history (PRD F5). Enforced in the prompt.
 */
export interface FactPack {
  stopId: string;
  characterId: GrudgeCharacterId;
  /** 8–12 verified facts (PRD content pipeline). */
  facts: Fact[];
  /** named present-day locals the character can name-drop for punchlines. */
  localReferences: LocalReference[];
  /** the one grievance hook for THIS character at THIS stop (PRD §7). */
  grievanceHook: string;
  /** the single era-grounded anachronism misunderstanding for this stop. */
  anachronism?: string;
  /** true once the pack has been authored + fact-checked. Stubs are false. */
  verified: boolean;
}

/** A running character card (persona), independent of any one stop. */
export interface GrudgeCharacter {
  id: GrudgeCharacterId;
  name: string;
  type: CharacterType;
  /** camera-wake class (PRD F2). */
  objectClass: ObjectClass;
  /** era / date of the object or person. */
  era: string;
  /** short ElevenLabs voice description. */
  voiceHint: string;
  /** real ElevenLabs voiceId, if assigned. */
  voiceId?: string;
  /** one-word-ish temperament, e.g. "Pompous, wounded dignity". */
  temperament: string;
  /**
   * The persistent grievance that colours the whole walk — the thing they never
   * fully let go of (PRD §5 "Grievance" column).
   */
  coreGrievance: string;
  /** self-importance inversely proportional to the object (PRD comedy rule). */
  statusMismatch: string;
  /** first-person voice brief for the LLM: how they speak + what they fixate on. */
  persona: string;
  /**
   * A cached, in-character opener the agent says unprompted on wake. Cached so
   * the greeting lands instantly on venue wifi (PRD §9 latency mitigation).
   */
  greeting: string;
  /** the stop ids this character owns (a character recurs across the loop). */
  stopIds: string[];
}

/** A stop on the Dalston loop from Ramen Space (PRD F1: 6 stops). */
export interface Stop {
  id: string;
  /** 1-based order along the loop. */
  order: number;
  name: string;
  lat: number;
  lng: number;
  /** metres; proximity unlock radius. */
  unlockRadius: number;
  characterId: GrudgeCharacterId;
  /** what to point the camera at here (PRD F2). */
  objectClass: ObjectClass;
  /** short card label. */
  blurb: string;
  /** walking directions to the next stop. */
  walkToNext?: string;
}

// ── Session state: memory + the grudge ledger (PRD F4, F6) ───────────────────

/** One thing that happened at a stop, kept so later stops can call back to it. */
export interface SessionEvent {
  stopId: string;
  characterId: GrudgeCharacterId;
  /** a one-line summary the next character can reference audibly. */
  summary: string;
  ts: number;
}

/** One accumulated grievance — a single line in the shareable ledger (PRD F6). */
export interface Grudge {
  id: string;
  characterId: GrudgeCharacterId;
  stopId: string;
  /** one line, e.g. "The Bollard: you photographed the postbox, not me. Noted." */
  line: string;
  ts: number;
}

/** The whole walk's memory — injected into agent context across stops (PRD F4). */
export interface SessionMemory {
  visitedStops: string[];
  events: SessionEvent[];
  grudges: Grudge[];
}

export const EMPTY_SESSION: SessionMemory = {
  visitedStops: [],
  events: [],
  grudges: [],
};

/**
 * Project a Stop onto the existing GhostSpot map/proximity contract so the whole
 * Grudge Map map + ProximityEngine + voice pipeline works unchanged. `seed` carries
 * the character id so the conversation layer can resolve the grudge character.
 */
export function stopToGhostSpot(stop: Stop): GhostSpot {
  return {
    id: stop.id,
    title: stop.name,
    lat: stop.lat,
    lng: stop.lng,
    unlockRadius: stop.unlockRadius,
    icon: stop.objectClass,
    seed: stop.characterId,
    curated: true,
  };
}
