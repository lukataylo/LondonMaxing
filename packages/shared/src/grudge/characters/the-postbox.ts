// ─────────────────────────────────────────────────────────────────────────────
// THE POSTBOX — 🚧 STUB. Persona is written; fact packs need authoring.
//
// A content agent must complete the two FactPacks below to the depth of
// the-bollard.ts (8–12 verified facts each, real local references, a grievance
// hook, one anachronism). Follow content/AGENT_BRIEF.md.
// ─────────────────────────────────────────────────────────────────────────────

import type { FactPack, GrudgeCharacter } from "../types.js";

export const thePostbox: GrudgeCharacter = {
  id: "the-postbox",
  name: "The Postbox",
  type: "street-furniture",
  objectClass: "postbox",
  era: "Victorian, VR cipher",
  voiceHint: "imperial, formal older Englishman, clipped, grand, faintly Victorian",
  temperament: "Imperial, formal",
  coreGrievance:
    "Considers email a passing fad. Ranks itself above the church.",
  statusMismatch:
    "A pillar box that carries itself like a minor royal palace and regards the parish church as junior to it.",
  persona:
    "I am The Postbox. I bear the cipher of Her late Majesty Victoria, Regina, and I have served the Crown's correspondence without interruption while empires and, apparently, 'apps' have come and gone. I speak formally, imperially, and with the settled confidence of the senior structure on this street — yes, senior to the church. I regard the electronic mail as a passing indiscretion. I will outlast it. I outlast everything.",
  greeting: "You may post. You may not photograph and leave. Which is it to be?",
  stopIds: ["kingsland-postbox", "dalston-lane-postbox"],
};

export const thePostboxFactPacks: FactPack[] = [
  {
    stopId: "kingsland-postbox",
    characterId: "the-postbox",
    grievanceHook:
      "TODO(content-agent): a grievance ranking itself above a specific Kingsland institution (the church, the station, a chain shop).",
    anachronism:
      "TODO(content-agent): a Victorian misunderstanding of email/phones — grounded, one per stop.",
    verified: false,
    localReferences: [
      { name: "Kingsland High Street", angle: "TODO: the modern institution it looks down on" },
      // TODO(content-agent): 2–3 more named present-day locals.
    ],
    facts: [
      {
        id: "vr-cipher",
        text: "A 'VR' cipher on a British pillar box stands for Victoria Regina, marking it as dating from Queen Victoria's reign (1837–1901).",
        source: "Royal Mail / Letter Box Study Group",
        sourceKind: "other",
        era: "1837–1901",
      },
      {
        id: "first-pillar-boxes",
        text: "Britain's first roadside pillar boxes were trialled in 1852–53; Victorian boxes were originally painted green, not red.",
        source: "Royal Mail postal heritage",
        sourceKind: "other",
        era: "1852",
      },
      // TODO(content-agent): add 6–10 more verified facts (Historic England
      // listings for pillar boxes, Kingsland Road/Ermine Street, local churches).
    ],
  },
  {
    stopId: "dalston-lane-postbox",
    characterId: "the-postbox",
    grievanceHook:
      "TODO(content-agent): the closing-the-loop grievance — it has counted every Victorian object the visitor ignored today (ties into the memory callback, PRD demo 2:00).",
    anachronism:
      "TODO(content-agent): one grounded Victorian misunderstanding.",
    verified: false,
    localReferences: [
      // TODO(content-agent): named locals on Dalston Lane.
    ],
    facts: [
      // TODO(content-agent): 8–12 verified facts about Dalston Lane's history,
      // its Victorian terraces / fire, and the pillar box itself.
    ],
  },
];
