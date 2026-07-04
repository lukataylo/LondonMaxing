# Historical Voice Eval — Report

Persona-fidelity eval for the blue-plaque character slate (see
`BLUE_PLAQUE_CHARACTER_MAP.md`): for each figure, gather real sourced public
statements (with context and how the public reacted), derive a voice profile
from a **training split**, generate a new in-character statement for the
situation behind each **held-out test item**, and have an LLM judge score the
generated statement against what the person actually said.

This validates the core assumption behind Grudge Map's voice
generation: that a persona derived only from real, sourced quotes (never from
an LLM's undifferentiated impression of "how X sounds") produces statements
that plausibly match the real person's voice and stance.

## Method

1. **Research** — one haiku agent per character searched for real public
   statements (speeches, letters, published writing, interviews, trial
   testimony, official citations), each with context, public reaction, date,
   and a real source citation. Apocryphal/misattributed quotes were instructed
   to be skipped.
2. **Split** — each character's items were split, holding out the last ~25%
   (min 2, max 4) as a hidden test set never shown to persona derivation.
3. **Derive persona** — an agent read only the training split and wrote a
   voice profile (tone, vocabulary, rhetorical habits, stances, "would never
   say") grounded strictly in that evidence. Saved as
   `eval/personas/<slug>.md`. This is the artifact the `historical-voice`
   Claude Skill (`.claude/skills/historical-voice/SKILL.md`) consumes.
4. **Generate** — for each held-out item, an agent was given the persona
   profile plus only the *situation* (not the real quote) and asked to write
   what that person would plausibly have said.
5. **Judge** — a separate agent scored the generated line against the real
   historical statement + real public reaction, 1-5 on:
   - **voiceFidelity** — same voice/register/style?
   - **contentFidelity** — same stance/argument/attitude?
   - **plausibility** — could this pass as something they really said?

Data lives in `eval/data/<slug>/{raw,train,test}.json`, personas in
`eval/personas/<slug>.md`, full per-item judged results in
`eval/results/<slug>.json`, and `eval/summary.json` is the rollup this report
is generated from.

## Headline numbers

26 characters, 326 sourced statements gathered, 100 held out for eval (99
successfully judged — one Bob Marley generation was blocked by a content
filter and dropped rather than retried).

Weighted mean across all judged items: **voice 3.89 / content 3.48 / plausibility 3.86** (out of 5).

## Per-character results (sorted by overall score)

| Character | Train | Test | Judged | Voice | Content | Plausibility | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|
| Sigmund Freud | 14 | 4 | 4 | 5.00 | 5.00 | 5.00 | **5.00** |
| Oscar Wilde | 16 | 4 | 4 | 5.00 | 4.75 | 4.25 | **4.67** |
| John Keats | 13 | 4 | 4 | 4.75 | 4.75 | 4.50 | **4.67** |
| George Orwell | 14 | 4 | 4 | 5.00 | 3.75 | 5.00 | **4.58** |
| Benjamin Franklin | 16 | 4 | 4 | 4.50 | 4.50 | 4.25 | **4.42** |
| Samuel Pepys | 13 | 4 | 4 | 4.50 | 3.75 | 4.50 | **4.25** |
| Charles Dickens | 16 | 4 | 4 | 4.50 | 3.75 | 4.25 | **4.17** |
| Karl Marx | 12 | 4 | 4 | 4.50 | 3.75 | 4.25 | **4.17** |
| Samuel Johnson | 14 | 4 | 4 | 4.75 | 3.00 | 4.50 | **4.08** |
| Mahatma Gandhi | 13 | 4 | 4 | 4.50 | 3.50 | 4.25 | **4.08** |
| Arthur Conan Doyle | 15 | 4 | 4 | 4.00 | 3.75 | 4.00 | **3.92** |
| William Shakespeare | 12 | 4 | 4 | 3.75 | 3.75 | 3.75 | **3.75** |
| Ada Lovelace | 14 | 4 | 4 | 3.75 | 3.75 | 3.75 | **3.75** |
| Mary Seacole | 11 | 4 | 4 | 4.00 | 2.75 | 4.50 | **3.75** |
| Olive Morris | 14 | 4 | 4 | 3.00 | 4.25 | 3.50 | **3.58** |
| Jimi Hendrix | 14 | 4 | 4 | 3.75 | 3.00 | 3.75 | **3.50** |
| Ellen and William Craft | 11 | 4 | 4 | 3.25 | 3.00 | 3.50 | **3.25** |
| Alfred Hitchcock | 15 | 4 | 4 | 3.75 | 2.50 | 3.50 | **3.25** |
| Bobby Moore | 10 | 4 | 4 | 3.50 | 2.75 | 3.50 | **3.25** |
| Bob Marley | 9 | 4 | 3 | 3.67 | 2.67 | 3.33 | **3.22** |
| Harry Beck | 5 | 2 | 2 | 3.00 | 3.50 | 3.00 | **3.17** |
| Joan Clarke | 6 | 3 | 3 | 3.33 | 2.67 | 3.33 | **3.11** |
| Derek Jarman | 16 | 4 | 4 | 2.75 | 3.50 | 3.00 | **3.08** |
| Noor Inayat Khan | 12 | 4 | 4 | 2.75 | 2.50 | 3.25 | **2.83** |
| Sophia Duleep Singh | 7 | 3 | 3 | 2.33 | 2.67 | 2.67 | **2.56** |
| Charlie Chaplin | 14 | 4 | 4 | 2.50 | 2.50 | 2.25 | **2.42** |

## Reading the results

- **Best fit** (Freud, Wilde, Keats, Orwell, Franklin): these figures left
  large, stylistically distinctive, first-person written or transcribed
  records (Freud's essays, Wilde's letters/epigrams, Keats's letters, Orwell's
  essays, Franklin's autobiography/letters) — plenty of signal for a training
  split to lock onto a recognizable voice.
- **Weakest fit** (Chaplin, Sophia Duleep Singh, Noor Inayat Khan, Derek
  Jarman): two different failure modes showed up here, worth telling apart:
  - **Thin/indirect personal record** — Noor Inayat Khan left almost no
    surviving first-person public statements (she was a covert wartime radio
    operator who died at 24); every held-out item the research agent found
    was *third-person* — a Gestapo interrogator's postwar testimony, her
    George Cross citation, her SOE trainer's notes — not her own words. The
    judge agent caught this itself in its rationale ("there is no real
    utterance of Noor's to line up against"). Her 2.83 score reflects a data
    problem, not a bad persona derivation — treat it as **not a valid signal**.
    Sophia Duleep Singh (7 train items) and Joan Clarke/Harry Beck (5-6 train
    items) are milder versions of the same issue: too little material for a
    reliable held-out test.
  - **Genuinely harder voice** — Chaplin's low score looks like a real
    persona-derivation miss rather than thin data (14 training items, a
    reasonably well-documented figure): his surviving public statements split
    across silent-era physical comedy, interviews, and courtroom/political
    testimony, which may be pulling the derived profile toward one register
    when the held-out situations called for another.
- **One technical failure**: a Bob Marley generation was blocked by a content
  filter (likely Rastafari/political phrasing) and dropped rather than
  retried — his average is over 3 judged items, not 4.

## Caveats

- Judging is **LLM-on-LLM** (haiku/session-model judge scoring session-model
  generations) — these are not human-verified fidelity scores, just a
  consistent automated proxy. Treat scores as relative/ranking signal, not
  ground truth.
- Research was done by haiku agents for cost/speed; sources were required but
  not independently re-verified the way `content/AGENT_BRIEF.md`'s sourcing
  rules demand for shipped Grudge Map content — before using any of
  `eval/data/*/raw.json` in the actual product, re-check sources the way the
  existing content pipeline does.
- Character count: the blue-plaque map's "first-wave 24" actually lists ~27
  entries including two collective/institutional ones (Ayahs' Home, Match
  Girls' Strike) with no individually-attributable public statements — those
  two were excluded from this eval; the other 26 named individuals/duos were
  all run.

## Reuse

`.claude/skills/historical-voice/SKILL.md` is a shared, parameterized skill:
given a character name and a new situation, it loads that character's
`eval/personas/<slug>.md` and writes an in-character statement the same way
the eval's "generate" stage did — so the eval and the reusable skill are
backed by the same artifact.
