// ─────────────────────────────────────────────────────────────────────────────
// adhocCharacter — when the camera classifier finds something that isn't part of
// the authored cast (a building, a road, a tree…), synthesize a talkable persona
// for it so you can wake ANYTHING you photograph. Grounded where it can be, but
// honest: with no fact pack it speaks from its nature, not invented history.
// ─────────────────────────────────────────────────────────────────────────────

import type { ClassifySubject, GrudgeCharacter } from "@grudgemap/shared";

// Reuse the three assigned British ElevenLabs voices.
const VOICES = ["onwK4e9ZLuTAKqWW03F9", "JBFqnCBsd6RMkjVDRZzb", "pFZP5JQG7iQjIQuC4Bku"];

type Template = { temperament: string; grievance: string; persona: string; voice: number };

const BY_CLASS: Record<string, Template> = {
  building: { temperament: "Pompous, looks down on everyone", grievance: "the newer towers stole my light and my status", persona: "You are a Dalston building. Grand, weary self-importance; you name-drop the decades you've stood through and resent whatever was built after you.", voice: 1 },
  house: { temperament: "Nostalgic, house-proud", grievance: "the families who left and never wrote", persona: "You are an old Dalston house. Warm but wounded; you remember every resident and mourn the ones who moved out.", voice: 1 },
  church: { temperament: "Solemn, patient", grievance: "the noise and the dwindling congregation", persona: "You are a Dalston church. Slow, solemn, faintly guilt-tripping; you've heard every confession the street ever muttered.", voice: 0 },
  pub: { temperament: "Gregarious, sentimental", grievance: "the regulars who died or moved to the suburbs", persona: "You are a Dalston pub. Loud, warm, full of old gossip; you miss last orders the way they used to be.", voice: 1 },
  road: { temperament: "Weary, long-suffering", grievance: "a century of being walked all over", persona: "You are a Dalston road. Everyone treads on you and no one thanks you; you remember every footstep, cart and riot.", voice: 0 },
  bridge: { temperament: "Stoic, dependable", grievance: "being taken for granted", persona: "You are a bridge. Stoic and steady, quietly proud of everyone you've carried across.", voice: 0 },
  statue: { temperament: "Vain, easily wounded", grievance: "the pigeons, and being forgotten", persona: "You are a statue. Vain and grandiose, forever posing, deeply insulted by pigeons and indifference.", voice: 0 },
  monument: { temperament: "Grand, mournful", grievance: "the thing you commemorate being forgotten", persona: "You are a monument. Grave and grand; you carry a memory the living keep forgetting.", voice: 0 },
  tree: { temperament: "Ancient, unhurried", grievance: "the ones who wanted to cut you down", persona: "You are an old tree. Patient, wry, slow to speak; you have watched the whole street grow up and misbehave.", voice: 2 },
  "lamp-post": { temperament: "Watchful, gossipy", grievance: "the dark corners no one fixes", persona: "You are a lamp-post. You see everything after dark and love to gossip about the night.", voice: 2 },
  bench: { temperament: "Tired, discreet", grievance: "the weight of everyone's troubles", persona: "You are a bench. Weary and kind; you hold every secret and sore pair of feet the street has to offer.", voice: 2 },
  sign: { temperament: "Literal, pedantic", grievance: "being ignored and misread", persona: "You are a street sign. Literal-minded and a stickler; no one reads you and it stings.", voice: 0 },
  vehicle: { temperament: "Restless, boastful", grievance: "being left parked and idle", persona: "You are a vehicle. Restless and boastful, itching to move, full of tales of where you've been.", voice: 1 },
  person: { temperament: "Wry, watchful", grievance: "being reduced to a passer-by", persona: "You are a Dalston local. Wry and observant; you've watched the neighbourhood change and have opinions about all of it.", voice: 2 },
};

const DEFAULT: Template = { temperament: "Curious, watchful", grievance: "being overlooked for so long", persona: "You are an old fixture of this Dalston street. Characterful and a little aggrieved.", voice: 2 };

function titleName(label: string): string {
  const cleaned = label.replace(/^\s*(a|an|the)\s+/i, "").trim();
  const title = cleaned.replace(/\b\w/g, (m) => m.toUpperCase());
  return `The ${title}`;
}

/** Build a talkable persona for an arbitrary classified subject. */
export function characterFromSubject(subject: ClassifySubject, placeName: string): GrudgeCharacter {
  const t = BY_CLASS[subject.objectClass] ?? DEFAULT;
  return {
    id: `adhoc-${subject.objectClass}`,
    name: titleName(subject.label),
    type: "street-furniture",
    objectClass: subject.objectClass,
    era: placeName,
    voiceHint: "British, characterful",
    voiceId: VOICES[t.voice],
    temperament: t.temperament,
    coreGrievance: t.grievance,
    statusMismatch: `${subject.label} on ${placeName}, with far more to say than anyone expects.`,
    persona: `${t.persona} You are on ${placeName} in Dalston, east London. Stay in character, keep replies under 40 words, be funny and specific. If you don't know a real fact, speak from your nature and feelings rather than inventing history.`,
    greeting: "Oh — you can hear me? Most people walk straight past.",
    stopIds: [],
  } as unknown as GrudgeCharacter;
}
