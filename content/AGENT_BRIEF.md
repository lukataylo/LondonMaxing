# Grudge Map — Content Authoring Brief (for an agent or a human)

**You are authoring the character backgrounds, fact packs, and prompting for
Grudge Map.** This is the content that makes the app funny *and* true. Read this
whole file, then work through the checklist at the bottom.

> Grudge Map: London's street furniture and dead locals talk to you as you walk.
> They remember you, they hold grudges, and **everything they say is grounded in
> real, verifiable local history.** Grounding is what keeps it magical instead of
> gimmicky — so the sourcing rules below are not optional.

---

## 1. Where the content lives (the files you edit)

All content is typed TypeScript so it fails the build if it's malformed. You edit
these files — nothing else:

| File | Status | Your job |
|---|---|---|
| `packages/shared/src/grudge/characters/the-bollard.ts` | ✅ **reference** | Do not change. Copy its shape and depth. |
| `packages/shared/src/grudge/characters/edith.ts` | 🚧 stub | Complete both fact packs. |
| `packages/shared/src/grudge/characters/the-postbox.ts` | 🚧 stub | Complete both fact packs. |
| `packages/shared/src/grudge/stops.ts` | ⚠️ approx | Verify/correct the 6 coordinates on the ground. |

The **types + rules** you must satisfy are in
`packages/shared/src/grudge/types.ts` and enforced in
`packages/shared/src/grudge/prompt.ts`. Read both.

**`the-bollard.ts` is your gold standard.** Every character + fact pack you write
should match it for structure, depth (8–12 facts), and comedy.

After editing, prove it compiles:

```bash
corepack pnpm --filter @grudgemap/shared build
```

---

## 2. The cast (PRD §5) — keep them exactly on-model

| Character | Type | Voice | Grievance |
|---|---|---|---|
| **The Bollard** | cast-iron street furniture, 1817 pattern | Pompous, wounded dignity | Believes it is critical infrastructure. Nobody has looked at it since 1974. |
| **Edith** | ghost, 1970s Dalston squatter | Dry, suspicious | Her local is now a specialty coffee shop. Opinions about the price of everything. |
| **The Postbox** | Victorian VR-cipher pillar box | Imperial, formal | Considers email a passing fad. Ranks itself above the church. |

Do **not** rewrite a character's `persona`, `temperament`, `coreGrievance`,
`statusMismatch`, `voiceHint`, or `greeting` without the builder's sign-off.
Your work is the **fact packs** (and coordinate fixes).

---

## 3. The comedy contract (enforced in the prompt — write facts that feed it)

Every character reply, at runtime, must contain:

1. **One verifiable historical fact — drawn ONLY from that stop's fact pack.**
   No parametric history. If it isn't in the pack, the character can't say it.
2. **One named present-day local reference** (a real shop, market, café, station).
3. **≤ 40 words.**
4. **At most one grievance callback per stop.**

Plus: status mismatch (self-importance inversely proportional to the object),
**one era-grounded anachronism per stop**, history is the setup / the present is
the punchline, never explain the joke, never tour-guide voice, never break
character.

So when you author a fact pack you are supplying the **raw material** for those
rules: 8–12 tight facts (the setups), a handful of named present-day locals (the
punchlines), a grievance hook, and one anachronism.

---

## 4. Sourcing rules (this is the important part)

Every `Fact` needs a real, checkable `source` and the right `sourceKind`. Prefer,
in order:

1. `historic-england` — the National Heritage List (listed buildings, K-series
   telephone boxes, some pillar boxes/bollards). https://historicengland.org.uk/listing/the-list/
2. `blue-plaque` — English Heritage / Hackney Society plaques.
3. `wikidata` / Wikipedia — for dates, closures, railway/borough facts.
4. `archive` — Hackney Archives, Layers of London, Britain from Above, newspaper archives.
5. `local-press` — Hackney Gazette, venue/market official pages.

Rules:

- **One fact = one checkable claim.** No "it is said that…", no vibes.
- Keep each fact **short and speakable** — the character says it aloud in < 40 words.
- Put the era in `era` where it helps the anachronism land.
- **Set `verified: true` on a fact pack ONLY when every fact in it has been
  checked against its source.** Leave `false` until then. (The reference pack is
  deliberately still `false` — a human must confirm each source on the day.)
- If you can't verify a fact, **cut it.** A thin true pack beats a fat false one.
  PRD §10: *every line spoken on stage must trace to a verifiable fact.*

---

## 5. The Dalston loop (PRD F1) — 6 stops, characters recur

Defined in `stops.ts`. The recurrence is deliberate: it powers the memory
callbacks (PRD demo 2:00 — *"that's the third Victorian thing you've ignored
today"*).

| # | Stop | Character | Camera target |
|---|---|---|---|
| 1 | The Gillett Square Bollard | The Bollard | bollard |
| 2 | The Kingsland High Street Postbox | The Postbox | postbox |
| 3 | Ridley Road Market | Edith | ghost sign |
| 4 | The Ashwin Street Bollard | The Bollard | bollard |
| 5 | Edith's Old Local (now a coffee shop) | Edith | shopfront |
| 6 | The Dalston Lane Pillar Box | The Postbox | postbox |

**Coordinate task:** the lat/lng in `stops.ts` are hand-placed approximations.
Walk the loop from Ramen Space (Bradbury Street / Gillett Square) and correct each
to the actual object. Note real, nameable objects (which specific bollard, which
pillar box — record its cipher and any Historic England list entry).

---

## 6. Definition of done (per fact pack)

A fact pack is done when:

- [ ] 8–12 facts, each with a real `source` + correct `sourceKind`.
- [ ] Every fact independently checkable; `verified` reflects the truth.
- [ ] 3+ named present-day `localReferences`, each a real Dalston place.
- [ ] A `grievanceHook` that is specific to this character at this stop (not generic).
- [ ] One `anachronism`, grounded in the character's era.
- [ ] `corepack pnpm --filter @grudgemap/shared build` passes.
- [ ] Tone-tested: read three sample replies aloud. Do they land in ≤ 40 words,
      history-as-setup / present-as-punchline, in character? (PRD §5, §9.)

---

## 7. Checklist / order of work

1. Read `the-bollard.ts` end to end. It is the pattern.
2. `edith.ts` → fill `ridley-road-market` pack, then `dalston-lane-coffee` pack.
   (Find the real pub that became a coffee shop on/near Dalston Lane — name both,
   price both.)
3. `the-postbox.ts` → fill `kingsland-postbox`, then `dalston-lane-postbox`.
   (The stop-6 hook should tie into the running memory callback.)
4. Walk the loop; correct all 6 coordinates in `stops.ts`; record the real objects.
5. Optionally deepen the two Bollard packs and flip verified facts to `true` once
   checked.
6. Build, then hand three sample lines per character back to the builder for a
   tone check.

See `content/SCHEMA.md` for a field-by-field reference and
`content/SOURCES.md` for a starter list of Dalston sources.
