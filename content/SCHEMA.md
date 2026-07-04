# Grudge Map — Content Schema (field reference)

Authoritative types: `packages/shared/src/grudge/types.ts`. This is the plain-English
version. Everything is TypeScript, so a wrong shape fails `pnpm --filter @grudgemap/shared build`.

## `GrudgeCharacter` (the persona — usually pre-filled, don't change without sign-off)

| field | type | notes |
|---|---|---|
| `id` | `"the-bollard" \| "edith" \| "the-postbox"` | stable id; matches stop `characterId`. |
| `name` | string | display name. |
| `type` | `"street-furniture" \| "ghost"` | drives wording in the prompt. |
| `objectClass` | `"bollard" \| "postbox" \| "ghost-sign" \| "shopfront" \| "ghost"` | what the camera must classify to wake it (PRD F2). |
| `era` | string | e.g. `"cast 1817 pattern"`, `"1970s Dalston squatter"`. |
| `voiceHint` | string | short ElevenLabs voice description. |
| `voiceId?` | string | ElevenLabs voice id (assigned in `voices.ts`). |
| `temperament` | string | e.g. `"Pompous, wounded dignity"`. |
| `coreGrievance` | string | the grievance that colours the whole walk. |
| `statusMismatch` | string | self-importance inversely proportional to the object. |
| `persona` | string | first-person voice brief for the LLM. |
| `greeting` | string | cached, in-character opener said on wake (kept short for latency). |
| `stopIds` | string[] | the stops this character owns (they recur). |

## `FactPack` (**this is what you author** — one per character per stop)

| field | type | notes |
|---|---|---|
| `stopId` | string | matches a stop in `stops.ts`. |
| `characterId` | GrudgeCharacterId | the owning character. |
| `facts` | `Fact[]` | **8–12** verified facts. See below. |
| `localReferences` | `LocalReference[]` | **3+** named present-day locals (punchline material). |
| `grievanceHook` | string | the one grievance for this character at this stop; specific, not generic. |
| `anachronism?` | string | one era-grounded misunderstanding for this stop. |
| `verified` | boolean | `true` ONLY when every fact is source-checked. |

## `Fact`

| field | type | notes |
|---|---|---|
| `id` | string | kebab-case, unique within the pack. |
| `text` | string | one checkable claim, tight enough to say aloud in < 40 words. |
| `source` | string | human-readable provenance, e.g. `"Historic England NHLE 1391145"`. |
| `sourceKind` | `"historic-england" \| "blue-plaque" \| "wikidata" \| "archive" \| "local-press" \| "other"` | prefer higher-authority kinds. |
| `sourceUrl?` | string | link where possible. |
| `era?` | string | e.g. `"1852"`, `"Victorian"`, `"1970s"`. |

## `LocalReference`

| field | type | notes |
|---|---|---|
| `name` | string | a real Dalston place: `"Ridley Road Market"`, `"Café OTO"`, `"a £4.50 oat flat white"`. |
| `angle?` | string | why it's funny / how the character weaponises it. |

## How the prompt uses your content (so you know what matters)

`buildGrudgeSystemPrompt(character, factPack, memory)` renders:
- the persona + the four HARD RULES (1 fact, 1 local, ≤40 words, ≤1 grievance/stop),
- the **fact pack** as "you may use ONLY these facts as history",
- the **local references** as "use one per turn as the punchline",
- the **grievance hook** and **anachronism** for this stop,
- the **session memory** so the character makes one audible callback.

Thin/empty packs degrade gracefully (the character is told to invent no history),
but the demo only sings when the pack is full and true.
