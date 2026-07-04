// Registry of the MVP cast + their fact packs. A content agent adds a character
// by creating a sibling file (mirroring the-bollard.ts) and registering it here.

import type { FactPack, GrudgeCharacter, GrudgeCharacterId } from "../types.js";
import { theBollard, theBollardFactPacks } from "./the-bollard.js";
import { edith, edithFactPacks } from "./edith.js";
import { thePostbox, thePostboxFactPacks } from "./the-postbox.js";

export const GRUDGE_CHARACTERS: GrudgeCharacter[] = [theBollard, edith, thePostbox];

export const FACT_PACKS: FactPack[] = [
  ...theBollardFactPacks,
  ...edithFactPacks,
  ...thePostboxFactPacks,
];

export function getGrudgeCharacter(id: string): GrudgeCharacter | undefined {
  return GRUDGE_CHARACTERS.find((c) => c.id === id);
}

/** The character that owns a given stop. */
export function getCharacterForStop(stopId: string): GrudgeCharacter | undefined {
  return GRUDGE_CHARACTERS.find((c) => c.stopIds.includes(stopId));
}

/** The fact pack for a specific character at a specific stop. */
export function getFactPack(
  characterId: GrudgeCharacterId,
  stopId: string,
): FactPack | undefined {
  return FACT_PACKS.find((p) => p.characterId === characterId && p.stopId === stopId);
}

export { theBollard, edith, thePostbox };
