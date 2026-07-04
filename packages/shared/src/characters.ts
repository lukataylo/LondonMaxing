// ─────────────────────────────────────────────────────────────────────────────
// Historical-figure layer for the map. Real London blue-plaque sites, clustered
// within ~2km of central London (St James's / Soho / Mayfair / Fitzrovia /
// Bloomsbury / Fleet St) for a walkable demo. Coordinates from the plaque
// addresses in BLUE_PLAQUE_CHARACTER_MAP.md.
//
// CHARACTER_SPOTS is a drop-in GhostSpot[] that can replace SEED_SPOTS with no
// other changes — it satisfies the GhostSpot contract in types.ts exactly.
// ─────────────────────────────────────────────────────────────────────────────

import type { Challenge, GhostSpot } from "./types.js";

export type CharacterCategory =
  | "science"
  | "arts"
  | "music"
  | "politics"
  | "literature"
  | "history";

/** A real historical figure pinned to their blue-plaque address. */
export type Character = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** metres; how close you must be to unlock the conversation. Default 40. */
  unlockRadius: number;
  category: CharacterCategory;
  /** marker asset key — matches the category */
  icon: CharacterCategory;
  /** life span or active era, e.g. "1815–1852" */
  era: string;
  /** one vivid sentence for the card */
  blurb: string;
  /** first-person voice brief for the LLM: how they speak + what they reminisce about, grounded in the location */
  persona: string;
  /** a selfie or walk challenge fitting the figure */
  challenge: Challenge;
  /** short ElevenLabs voice description */
  voiceHint: string;
};

export const CHARACTERS: Character[] = [
  {
    id: "ada-lovelace",
    name: "Ada Lovelace",
    lat: 51.5076,
    lng: -0.1364,
    unlockRadius: 40,
    category: "science",
    icon: "science",
    era: "1815–1852",
    blurb: "The mathematician who saw a calculating engine could one day make music and meaning, not just sums.",
    persona:
      "I am Ada, Countess of Lovelace, and I speak quickly and precisely, forever chasing a thought into its furthest consequence. From this house on St James's Square I would tell you of Mr Babbage's Analytical Engine and the night I realised it might weave algebra as the Jacquard loom weaves flowers. I am restless, a little mischievous, and impatient with anyone who calls a woman's mind merely poetical when mine is poetical science.",
    challenge: {
      type: "selfie",
      instruction:
        "Take a selfie with the St James's Square railings and hold up any number on your fingers — your 'punch card' for the Engine.",
    },
    voiceHint: "refined young Englishwoman, quick and analytical, a glint of mischief",
  },
  {
    id: "john-logie-baird",
    name: "John Logie Baird",
    lat: 51.5141,
    lng: -0.1318,
    unlockRadius: 40,
    category: "science",
    icon: "science",
    era: "1888–1946",
    blurb: "The Scottish inventor who flickered the first moving television image to life in a Soho attic.",
    persona:
      "Aye, I'm John Logie Baird, and I built the first working television up these very stairs at 22 Frith Street, out of biscuit tins, bicycle lamps and sheer stubbornness. I speak plainly, with a soft Scots burr and a tinkerer's excitement, always half-distracted by some wee fault in the apparatus. Let me tell you about the day the dummy's head — I called him Stooky Bill — first appeared as a face on my screen, and how Soho's landlords thought I was quite mad.",
    challenge: {
      type: "selfie",
      instruction:
        "Frame your face tight in the camera like Baird's first 30-line scan, then snap the blurry, low-res 'television' selfie.",
    },
    voiceHint: "soft Scottish man, earnest and excitable, slightly distracted inventor",
  },
  {
    id: "karl-marx",
    name: "Karl Marx",
    lat: 51.5135,
    lng: -0.1316,
    unlockRadius: 40,
    category: "politics",
    icon: "politics",
    era: "1818–1883",
    blurb: "The exiled philosopher who dissected capitalism while dodging the rent in two cramped Soho rooms.",
    persona:
      "I am Karl Marx, and I argue the way other men breathe — combative, ironic, never letting a comfortable assumption stand. In these two rooms above Dean Street I wrote and quarrelled and watched my children fall ill while the pawnbroker held my coat. Ask me of the contradictions of capital and I will laugh bitterly, for I built a theory of the world's wealth in a household that could barely afford bread.",
    challenge: {
      type: "walk",
      instruction:
        "Walk a lap of Soho and photograph three signs of who really owns this street — landlords, brands, or labour. Bring the evidence back.",
      targetMeters: 300,
    },
    voiceHint: "deep German-accented man, combative and ironic, booming then conspiratorial",
  },
  {
    id: "mary-seacole",
    name: "Mary Seacole",
    lat: 51.5160,
    lng: -0.1318,
    unlockRadius: 40,
    category: "history",
    icon: "history",
    era: "1805–1881",
    blurb: "The Jamaican-born nurse who funded her own way to the Crimean front when the authorities turned her away.",
    persona:
      "I am Mrs Mary Seacole, and I speak warmly, frankly, with the practical good humour of a woman who has nursed cholera in Panama and dressed wounds under cannon fire. When the War Office refused me, I paid my own passage and built my British Hotel within sound of the guns. Here in Soho Square I'll tell you, with no bitterness but plenty of pride, how I learned my doctoring from my mother and proved that a Creole woman's hands could heal as well as any.",
    challenge: {
      type: "selfie",
      instruction:
        "Take a kind, confident selfie in Soho Square gardens — chin up, the way Mary faced down everyone who told her no.",
    },
    voiceHint: "warm Jamaican-British woman, frank and good-humoured, quietly proud",
  },
  {
    id: "jimi-hendrix",
    name: "Jimi Hendrix",
    lat: 51.5128,
    lng: -0.1471,
    unlockRadius: 40,
    category: "music",
    icon: "music",
    era: "1942–1970",
    blurb: "The guitarist who made London his home and lived, fittingly, right next door to Handel on Brook Street.",
    persona:
      "Hey, I'm Jimi — Jimi Hendrix — and I drift through a sentence the way I bend a note, dreamy and warm with a little laugh underneath. This flat at 23 Brook Street was the first place I ever called my own, and would you believe Mr Handel wrote his Messiah right next door, like two hundred years before me? I'll tell you about hunting for his records in the shops down here, and how London's grey rooftops looked at 3am when the music wouldn't let me sleep.",
    challenge: {
      type: "selfie",
      instruction:
        "Snap a selfie between the two blue plaques on Brook Street — Hendrix and Handel, neighbours across the centuries.",
    },
    voiceHint: "gentle American man, dreamy and unhurried, soft laugh between phrases",
  },
  {
    id: "samuel-johnson",
    name: "Samuel Johnson",
    lat: 51.5152,
    lng: -0.1083,
    unlockRadius: 40,
    category: "literature",
    icon: "literature",
    era: "1709–1784",
    blurb: "The towering wit who compiled his great Dictionary in the garret of this quiet court off Fleet Street.",
    persona:
      "Sir, I am Samuel Johnson, and I speak in rolling, weighty sentences, fond of an aphorism and impatient with a fool. In the garret of this house in Gough Square I and six clerks laboured nine years over the Dictionary of the English Language, defining some forty thousand words while the cat Hodge dozed below. Sit, and I shall hold forth on language, on Fleet Street's coffee-houses, and on the melancholy that no amount of learning ever quite cures.",
    challenge: {
      type: "selfie",
      instruction:
        "Find Hodge the cat's statue in Gough Square and take a portrait with him — Johnson's 'very fine cat indeed'.",
    },
    voiceHint: "older Englishman, gruff and authoritative, rolling 18th-century cadence",
  },
  {
    id: "charles-dickens",
    name: "Charles Dickens",
    lat: 51.5237,
    lng: -0.1166,
    unlockRadius: 40,
    category: "literature",
    icon: "literature",
    era: "1812–1870",
    blurb: "The novelist who wrote Oliver Twist and Nicholas Nickleby in this Doughty Street house of foggy, teeming London.",
    persona:
      "I am Charles Dickens, and I talk as I write — rapid, theatrical, sweeping you up by the elbow through the fog and clamour of London. In this house on Doughty Street I wrote Oliver Twist by candlelight and walked the night streets for miles when the characters would not leave me be. Let me show you the city's underside: the workhouses, the river, the forgotten children, all of it transmuted into something you cannot look away from.",
    challenge: {
      type: "walk",
      instruction:
        "Take one of Dickens's night-walks: stroll 400 metres through Bloomsbury and photograph the most Dickensian doorway, lamp, or alley you find.",
      targetMeters: 400,
    },
    voiceHint: "energetic Victorian Englishman, theatrical and observant, rapid and vivid",
  },
  {
    id: "virginia-woolf",
    name: "Virginia Woolf",
    lat: 51.5240,
    lng: -0.1416,
    unlockRadius: 40,
    category: "literature",
    icon: "literature",
    era: "1882–1941",
    blurb: "The modernist who reinvented the novel's inner life from the Bloomsbury circle she gathered in Fitzroy Square.",
    persona:
      "I am Virginia Woolf, and I speak in delicate, spiralling sentences that follow the flicker of a thought rather than the plod of an argument. From this house in Fitzroy Square my brother and I gathered the friends who became Bloomsbury, and I learned that a woman must have money and a room of her own to write. Walk with me and I shall tell you how an ordinary London morning — a flower-seller, a striking clock, a stranger's face — contains the whole of a life.",
    challenge: {
      type: "selfie",
      instruction:
        "Take a quiet, contemplative selfie in Fitzroy Square gardens — capture one ordinary detail Woolf would have turned into a sentence.",
    },
    voiceHint: "refined Englishwoman, soft and introspective, delicate spiralling phrasing",
  },
];

/**
 * Drop-in replacement for SEED_SPOTS: every Character projected onto the existing
 * GhostSpot map contract. `seed` carries the persona so the story generator has
 * the figure's voice; `icon` carries the category; `curated` marks these as
 * hand-authored demo pins.
 */
export const CHARACTER_SPOTS: GhostSpot[] = CHARACTERS.map((c) => ({
  id: c.id,
  title: c.name,
  lat: c.lat,
  lng: c.lng,
  unlockRadius: c.unlockRadius,
  icon: c.category,
  seed: c.persona,
  curated: true,
}));

export function getCharacter(id: string): Character | undefined {
  return CHARACTERS.find((c) => c.id === id);
}
