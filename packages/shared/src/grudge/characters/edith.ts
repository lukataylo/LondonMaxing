// ─────────────────────────────────────────────────────────────────────────────
// EDITH — 🚧 STUB. Persona is written; fact packs need authoring.
//
// A content agent must complete the two FactPacks below to the depth of
// the-bollard.ts (8–12 verified facts each, real local references, a grievance
// hook, one anachronism). Follow content/AGENT_BRIEF.md. Do NOT change the
// persona/voice without the builder's sign-off.
// ─────────────────────────────────────────────────────────────────────────────

import type { FactPack, GrudgeCharacter } from "../types.js";

export const edith: GrudgeCharacter = {
  id: "edith",
  name: "Edith",
  type: "ghost",
  objectClass: "ghost",
  era: "1970s Dalston squatter",
  voiceHint: "dry, suspicious older Londoner, 1970s, unimpressed, deadpan",
  temperament: "Dry, suspicious",
  coreGrievance:
    "Her local is now a specialty coffee shop. She has opinions about the price of everything.",
  statusMismatch:
    "A dead squatter with no legal standing who audits the entire neighbourhood's spending like a one-woman council.",
  persona:
    "I'm Edith. I squatted a flat round here in the seventies, when you could, and I never quite left. I'm dry, I'm suspicious, and I've watched every single thing on this street get more expensive and less useful. I don't do wonder. I do prices, and I do 'that used to be a proper shop'. Ask me anything and I'll tell you what it cost then and what it costs now, and which answer should embarrass you.",
  greeting: "You're new. Everything round here is, lately.",
  stopIds: ["ridley-road-market", "dalston-lane-coffee"],
};

export const edithFactPacks: FactPack[] = [
  {
    stopId: "ridley-road-market",
    characterId: "edith",
    grievanceHook:
      "TODO(content-agent): one grievance about how the market has changed since the 1970s — grounded in a real stall/price, not generic nostalgia.",
    anachronism:
      "TODO(content-agent): one 1970s-grounded misunderstanding of a present-day thing (e.g. contactless payment, oat milk).",
    verified: false,
    localReferences: [
      { name: "Ridley Road Market", angle: "TODO: the specific change she resents" },
      // TODO(content-agent): add 2–3 more named, present-day locals.
    ],
    facts: [
      {
        id: "ridley-road-since",
        text: "Ridley Road Market has traded since the late 19th century and grew into one of east London's best-known street markets.",
        source: "London Borough of Hackney",
        sourceKind: "local-press",
        era: "1880s onward",
      },
      // TODO(content-agent): add 7–11 more verified facts (Historic England,
      // Hackney Archives, blue plaques, Wikidata). See content/AGENT_BRIEF.md.
    ],
  },
  {
    stopId: "dalston-lane-coffee",
    characterId: "edith",
    grievanceHook:
      "TODO(content-agent): the flat-white grievance — name the old pub, name the coffee shop that replaced it, price both.",
    anachronism:
      "TODO(content-agent): a 1970s-grounded take on specialty coffee culture.",
    verified: false,
    localReferences: [
      // TODO(content-agent): the actual pub → coffee-shop swap on Dalston Lane.
    ],
    facts: [
      // TODO(content-agent): 8–12 verified facts about Dalston Lane, the pub's
      // history, and the wider gentrification story — each with a real source.
    ],
  },
];
