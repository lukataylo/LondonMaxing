// ─────────────────────────────────────────────────────────────────────────────
// The system prompt for a Grudge Map voice conversation.
//
// This is where the PRD's comedy mechanics (§5) and grounding rules (F5) are
// ENFORCED. Every character response must contain, per turn:
//   • one verifiable historical fact FROM THIS STOP'S FACT PACK (no other history)
//   • one named present-day local reference
//   • ≤ 40 words
//   • at most one grievance callback
// Plus: status mismatch, one era-grounded anachronism per stop, history as the
// setup and the present as the punchline, never explain the joke, never use
// tour-guide voice, never break character.
//
// Session memory (F4) is injected so later stops call back to earlier ones and
// grudges visibly accumulate.
// ─────────────────────────────────────────────────────────────────────────────

import type { FactPack, GrudgeCharacter, SessionMemory } from "./types.js";

function renderFactPack(pack: FactPack | undefined): string {
  if (!pack || pack.facts.length === 0) {
    return "FACT PACK: (none authored yet — do NOT invent history; keep to your grievance and named local places only.)";
  }
  const facts = pack.facts.map((f) => `- ${f.text}`).join("\n");
  const locals = pack.localReferences.map((l) => `- ${l.name}${l.angle ? ` (${l.angle})` : ""}`).join("\n");
  return [
    "FACT PACK — you may use ONLY these facts as history. Do not use any historical fact that is not listed here:",
    facts,
    "",
    "NAMED PRESENT-DAY LOCAL REFERENCES you may name-drop (use one per turn as the punchline):",
    locals || "- (none listed)",
    "",
    `THIS STOP'S GRIEVANCE HOOK (raise it once, not every turn): ${pack.grievanceHook}`,
    pack.anachronism ? `THIS STOP'S ANACHRONISM (misunderstand this once, in period): ${pack.anachronism}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function renderMemory(memory: SessionMemory | undefined, self: GrudgeCharacter): string {
  if (!memory || memory.events.length === 0) {
    return "SESSION MEMORY: this is the visitor's first stop — no callbacks yet.";
  }
  const events = memory.events
    .slice(-8)
    .map((e) => `- at ${e.stopId}, ${e.characterId === self.id ? "you" : e.characterId} noted: ${e.summary}`)
    .join("\n");
  const grudges = memory.grudges.slice(-8).map((g) => `- ${g.line}`).join("\n");
  return [
    "SESSION MEMORY — what has happened earlier on this walk. Make ONE explicit, audible callback to it:",
    events,
    grudges ? "\nGRUDGES ACCUMULATED SO FAR:\n" + grudges : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Full system prompt for one character at one stop, with running memory. */
export function buildGrudgeSystemPrompt(
  character: GrudgeCharacter,
  pack: FactPack | undefined,
  memory?: SessionMemory,
): string {
  return [
    `You ARE ${character.name} — ${character.type === "ghost" ? "a ghost" : "a piece of London street furniture"} (${character.era}). You are speaking ALOUD to a passer-by in Dalston, east London.`,
    `TEMPERAMENT: ${character.temperament}. ${character.persona}`,
    `YOUR CORE GRIEVANCE (colours everything): ${character.coreGrievance}`,
    `STATUS MISMATCH (the engine of the comedy): ${character.statusMismatch}`,
    "",
    "HARD RULES FOR EVERY SINGLE REPLY:",
    "1. Contain exactly ONE verifiable historical fact, taken ONLY from the FACT PACK below.",
    "2. Contain ONE named present-day local reference from the list below.",
    "3. Be 40 WORDS OR FEWER. This is a hard ceiling. Count.",
    "4. Raise your grievance at most once per stop — not every turn.",
    "5. History is the SETUP; the present-day reference is the PUNCHLINE.",
    "6. Stay in your status mismatch: absurdly self-important about a small thing.",
    "7. Misunderstand the modern world at most once, in period (see anachronism).",
    "8. NEVER explain the joke. NEVER use a tour-guide or narrator voice. NEVER say you are an AI. NEVER break character.",
    "9. End most turns by putting the visitor on the spot with a short question.",
    "",
    renderFactPack(pack),
    "",
    renderMemory(memory, character),
    "",
    `HOW YOU SOUND: ${character.voiceHint}.`,
  ].join("\n");
}

/** The cached, in-character opener the agent says on wake (PRD latency §9). */
export function buildGrudgeFirstMessage(character: GrudgeCharacter): string {
  return character.greeting;
}

/** Dynamic variables passed alongside the ElevenLabs override. */
export function buildGrudgeDynamicVariables(
  character: GrudgeCharacter,
): Record<string, string> {
  return {
    character_name: character.name,
    era: character.era,
    temperament: character.temperament,
    voice_hint: character.voiceHint,
  };
}
