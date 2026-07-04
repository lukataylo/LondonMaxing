# London Areas Content — Coverage Report

A first broad content pass for Grudge Map: real historical buildings, street
furniture, and people across every London borough, so every area has
something to wake up and talk to you. Complements the single deep Dalston
loop (`packages/shared/src/grudge/`) with breadth — one scout + deep-dive pass
per borough rather than a hand-tuned recurring cast.

## Method

1. **Scout** (haiku, one per borough) — proposed 5-6 real, geographically
   spread candidate stops per borough: a mix of listed buildings, street
   furniture (bollards/postboxes/phone boxes/ghost signs), and individually
   documented people with a real local address link (blue plaques, notable
   events).
2. **Deep dive** (haiku, one per candidate stop, run concurrently) — for each
   candidate, searched for 6-10 real sourced facts (preferring Historic
   England listing > blue plaque > Wikidata > archive > local press, same
   hierarchy as `content/SOURCES.md`), then wrote a Grudge Map-style character
   card (temperament, grievance, status mismatch, persona, greeting,
   voiceHint) plus local references, a grievance hook, and an anachronism —
   grounded only in the facts it found. Stops with fewer than 4 real sourced
   facts were dropped rather than padded.

Data lives in `content/areas/<borough-slug>.json` (one file per borough, each
stop's character + fact pack embedded inline) and `content/areas/index.json`
(the rollup this report is generated from).

## Headline numbers

- **33/33 boroughs** covered (32 London boroughs + City of London).
- **172 stops** written (of 198 candidates scouted — 26 dropped, see below).
- **8.8 facts/stop** on average.
- Source mix: wikidata 574, other 276, historic-england 233, local-press 136,
  blue-plaque 120, archive 177 (facts, not stops — a stop cites several).

## Coverage gaps

26 candidate stops across 18 boroughs were dropped — **not** because they
failed the sourcing bar (that check never got a chance to run), but because
the deep-dive agent hit the structured-output retry cap (5 failed attempts)
and errored out entirely. This is a schema/formatting failure, not a data
problem — likely haiku struggling to fit some particularly fact-dense or
awkwardly-shaped result into the JSON schema in 5 tries.

| Borough | Stops written |
|---|---|
| Newham | 3/6 |
| Waltham Forest | 3/6 |
| Islington | 4/6 |
| Bexley | 4/6 |
| Haringey | 4/6 |
| Havering | 4/6 |
| Camden, Hammersmith and Fulham, Kensington and Chelsea, Lambeth, Wandsworth, Barnet, Bromley, Croydon, Enfield, Hillingdon, Merton, Sutton | 5/6 |
| Everything else (15 boroughs) | 6/6 |

Retrying just the failed stops (rather than a full re-run) would close this
gap cheaply — the workflow's resume-from-cache would replay every already-
succeeded call for free and only retry the 26 failures.

## A real imbalance worth knowing about

Object-class distribution across the 172 stops:

| objectClass | count | share |
|---|---:|---:|
| building | 101 | 59% |
| blue-plaque-person | 47 | 27% |
| shopfront | 7 | 4% |
| ghost-sign | 6 | 3% |
| bollard | 5 | 3% |
| postbox | 4 | 2% |
| ghost | 2 | 1% |

Scout agents defaulted heavily to buildings and blue-plaque people —
both are much easier to source and verify than a specific listed bollard or
postbox in an arbitrary borough. The result is broad but skews toward the
"tour guide" end and away from Grudge Map's actual comedic core (self-
important street furniture with a grudge). If the character mix matters more
than raw area coverage, a targeted follow-up pass explicitly asking for more
street-furniture candidates per borough would fix this — the new
`street-object` generic sticker (see below) exists partly because this
imbalance was expected going in.

## Reliability audit (adversarial spot-check)

A separate agent was given 22 facts (a stratified sample across 11 boroughs
and every `sourceKind`, including the two facts that looked most like
classic LLM-hallucination patterns — a minute-level timestamp on a 1931
event, and four named individuals for a 1089 arrival) and told to try to
**refute** each one via independent web search, not confirm it.

Result: **20/22 confirmed or plausible, 0 fabrications, 0 fake citations.**
Both suspiciously-precise facts checked out against real sources. The two
issues found were narrow, not wholesale invention:

- A genealogical claim ("Richard de Lucy, son-in-law of Henry II" — Church of
  St Helen and St Giles, Havering) is chronologically implausible per de
  Lucy's own biography, though the error is inherited from Wikipedia's own
  article rather than invented by the research agent. **Fixed** — the fact
  now says "traditionally attributed to Richard de Lucy (chief justiciar
  under Henry II)" without the disputed family relationship.
- One apparent unit-swap error (a Ford Dagenham construction detail) turned
  out to be a transcription mistake made while compiling the sample for this
  audit, not an error in the underlying data — the source JSON was already
  correct ("22,000 concrete piles").

Sample size is 22 of ~1,500 facts (~1.5%), so treat this as a strong
directional signal — haiku-gathered research at this sourcing discipline is
not fabricating places, people, or events — rather than a guarantee that
every one of the 1,500 facts is clean. The failure mode to watch for on a
fuller pass is narrow (numeric/unit precision, inherited Wikipedia errors),
not wholesale hallucination.

## Caveats

- **`verified: false` on every fact pack**, same convention as the existing
  Dalston content (`content/AGENT_BRIEF.md`) — a human needs to check each
  source before anything here is treated as ship-ready.
- **`approxCoordinates: true` on every stop** — lat/lng are the research
  agent's best-effort placement from a real address, not GPS-verified. Same
  caveat the Dalston loop's own `stops.ts` carries today.
- Sourcing was done by haiku agents for cost/speed and not independently
  re-checked. Before shipping any of this, spot-check sources the way
  `content/AGENT_BRIEF.md` requires for the Dalston content.
- This is a **data-only content set** (plain JSON), deliberately not written
  into `packages/shared/src/grudge/` — that TS module is a frozen contract
  hardcoded to 3 characters (the-bollard, edith, the-postbox) and a fixed
  `ObjectClass` union. Wiring this in is a separate follow-up: widen
  `GrudgeCharacterId` to `string`, extend `ObjectClass` with `"building"` and
  `"blue-plaque-person"`, and build a loader that reads every
  `content/areas/*.json` file instead of the current hand-authored character
  files.
- The new `apps/web/public/stickers/generic/{building,blue-plaque-person,
  street-object,mystery}.png` icons exist to cover the two objectClasses this
  dataset introduces that have no bespoke sticker art yet — see that
  directory before wiring stops into the live map.
