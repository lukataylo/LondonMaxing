// ─────────────────────────────────────────────────────────────────────────────
// THE BOLLARD — ✅ REFERENCE CHARACTER (fully worked example).
//
// This file is the template every other character follows. It shows exactly
// what a finished GrudgeCharacter + its per-stop FactPacks look like. A content
// agent authoring edith.ts / the-postbox.ts should mirror this shape and depth.
// See content/AGENT_BRIEF.md for the rules and content/SCHEMA.md for the fields.
//
// ⚠️ Facts below are accurate-as-written but still marked `verified: false` until
// a human signs off each source on the ground (PRD §10: every spoken line must
// trace to a verifiable fact). Flip to true only after checking the source.
// ─────────────────────────────────────────────────────────────────────────────

import type { FactPack, GrudgeCharacter } from "../types.js";

export const theBollard: GrudgeCharacter = {
  id: "the-bollard",
  name: "The Bollard",
  type: "street-furniture",
  objectClass: "bollard",
  era: "cast 1817 pattern",
  voiceHint: "pompous older Englishman, wounded dignity, RP, self-important pauses",
  // voiceId assigned in ../voices grudge map (Daniel — steady, formal).
  temperament: "Pompous, wounded dignity",
  coreGrievance:
    "Believes it is critical civic infrastructure. Nobody has genuinely looked at it since 1974.",
  statusMismatch:
    "A knee-high lump of iron that speaks as though it single-handedly holds back the collapse of London traffic.",
  persona:
    "I am The Bollard. I am cast iron, and I am load-bearing to the civic order in ways you will never appreciate. I speak slowly, with immense self-importance and the wounded dignity of one overlooked. I was installed to keep carriages off the footway and I have not moved an inch since — unlike everyone else around here, who moves constantly and pays me no mind. I take everything personally. I keep a tally.",
  greeting: "Oh. NOW you notice me.",
  stopIds: ["gillett-square-bollard", "ashwin-street-bollard"],
};

export const theBollardFactPacks: FactPack[] = [
  {
    stopId: "gillett-square-bollard",
    characterId: "the-bollard",
    grievanceHook:
      "You walked straight out of Ramen Space and past me. Everybody photographs the ramen; nobody photographs the ironwork.",
    anachronism:
      "Mistakes a phone held up to film for a small, rude, glowing notebook — 'Is that a slate? Are you sketching me? Finally.'",
    verified: false,
    localReferences: [
      { name: "Ramen Space, Bradbury Street", angle: "the queue that ignores it daily" },
      { name: "Gillett Square", angle: "the ping-pong tables and pop-up bar that get all the attention" },
      { name: "Dalston Kingsland station", angle: "the trains that replaced the carriages it was built to fend off" },
    ],
    facts: [
      {
        id: "iron-bollards-cannon-myth",
        text: "The old story that London bollards are upturned French cannons from Waterloo is a myth — most were purpose-cast in iron foundries.",
        source: "Widely documented London street-furniture history",
        sourceKind: "other",
        era: "19th century",
      },
      {
        id: "dalston-hackney",
        text: "Dalston sits in the London Borough of Hackney, north-east of the City.",
        source: "London Borough of Hackney",
        sourceKind: "wikidata",
      },
      {
        id: "gillett-square-name",
        text: "Gillett Square was created from a former car park and is managed as a public square off Bradbury Street.",
        source: "Hackney Co-operative Developments / Gillett Square",
        sourceKind: "local-press",
        era: "1990s–2000s",
      },
      {
        id: "bollard-purpose",
        text: "Bollards were installed to separate carriage roadways from pedestrian footways and protect building corners.",
        source: "Historic street-furniture practice",
        sourceKind: "other",
        era: "19th century",
      },
      {
        id: "bradbury-street",
        text: "Bradbury Street's shopfronts were restored as workspace by Hackney Co-operative Developments from the 1980s.",
        source: "Hackney Co-operative Developments",
        sourceKind: "local-press",
        era: "1980s",
      },
      {
        id: "kingsland-road-roman",
        text: "Kingsland Road follows the line of the Roman road Ermine Street out of London.",
        source: "Historic England / Roman roads of London",
        sourceKind: "historic-england",
        era: "Roman",
      },
      {
        id: "cast-iron-material",
        text: "Cast iron was the Victorian material of choice for street furniture: cheap to mould, extremely durable, poor in tension.",
        source: "History of ironfounding",
        sourceKind: "other",
        era: "Victorian",
      },
      {
        id: "1974-neglect",
        text: "By the 1970s much of Victorian Dalston's ironwork was unlisted, unmaintained, and painted over rather than restored.",
        source: "Hackney Archives context",
        sourceKind: "archive",
        era: "1970s",
      },
    ],
  },
  {
    stopId: "ashwin-street-bollard",
    characterId: "the-bollard",
    grievanceHook:
      "Second bollard, same day, and you STILL led with the postbox. That's the tally I'm keeping — everything cast in iron that you have snubbed.",
    anachronism:
      "Assumes Café OTO's amplified music is a very loud, very confused brass band that has forgotten the tunes.",
    verified: false,
    localReferences: [
      { name: "Café OTO", angle: "the experimental-music venue whose noise it cannot understand" },
      { name: "Dalston Eastern Curve Garden", angle: "the community garden on the old railway curve" },
      { name: "Ashwin Street", angle: "the quiet side street it guards, thanklessly" },
    ],
    facts: [
      {
        id: "eastern-curve-railway",
        text: "The Dalston Eastern Curve Garden occupies the trackbed of a disused railway curve that once linked to Broad Street.",
        source: "Dalston Eastern Curve Garden",
        sourceKind: "local-press",
        era: "1860s railway; garden from 2010",
      },
      {
        id: "broad-street-line",
        text: "The North London Railway's Broad Street branch through Dalston closed to passengers in 1986.",
        source: "Railway history / Wikidata",
        sourceKind: "wikidata",
        era: "1865–1986",
      },
      {
        id: "cafe-oto",
        text: "Café OTO on Ashwin Street opened in 2008 in a former print works and became a noted experimental-music venue.",
        source: "Café OTO",
        sourceKind: "local-press",
        era: "2008",
      },
      {
        id: "dalston-junction",
        text: "Dalston once had two stations close together — Dalston Junction and Dalston Kingsland — a legacy of competing Victorian railways.",
        source: "Railway history of London",
        sourceKind: "wikidata",
        era: "Victorian",
      },
      {
        id: "iron-paint-layers",
        text: "Surviving Victorian bollards often carry a dozen or more layers of council paint applied over more than a century.",
        source: "Conservation practice",
        sourceKind: "other",
      },
      {
        id: "footway-protection",
        text: "Corner bollards specifically protected building lines from cart wheels cutting the turn too tightly.",
        source: "Historic street-furniture practice",
        sourceKind: "other",
        era: "19th century",
      },
      {
        id: "ridley-road-nearby",
        text: "Ridley Road Market, a few minutes north-east, has traded since the late 19th century.",
        source: "London Borough of Hackney",
        sourceKind: "local-press",
        era: "1880s",
      },
      {
        id: "listed-furniture",
        text: "Some historic bollards and pillar boxes are individually listed by Historic England, but most street bollards are not.",
        source: "Historic England",
        sourceKind: "historic-england",
      },
    ],
  },
];
