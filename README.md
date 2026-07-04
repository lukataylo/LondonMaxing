# 👻 Old Haunts

**Point your phone at a Dalston street. Watch it rewind 130 years. Then talk to whatever's in the shot.**

Old Haunts is a location + camera PWA where London's street furniture and dead locals *wake up* and talk back — a pompous cast-iron bollard, a Victorian pillar box that ranks itself above the church, a 1970s ghost who has priced your flat white. Every word they say is grounded in verifiable local history. Nothing invented.

🔴 **Live demo:** https://grudge-map-production.up.railway.app
📍 **Built for:** Londonmaxxing 003 · Ramen Space, Gillett Square, Dalston, London — a ~6-stop Dalston walking loop.

> The repo/URL still say `grudge-map` (internal package scope is `@grudgemap/*`). The product is **Old Haunts**.

---

## ⚡ 30-second demo

You don't need to read the map. Just do this:

1. Open the live link on your **phone** and allow **camera** access.
2. Tap the **Camera** tab (center of the bottom bar).
3. Point at anything old — a bollard, a shopfront, a pillar box — pick an **era** on the dial (1890s · 1943 · 1974 · 2050) and hit the **shutter**.
4. The street **rewinds into that era** in front of you (image-to-image), while vision quietly figures out **what's in shot**.
5. Tap **🎙️ Wake it** and *talk out loud* — two-way AI voice, in character, citing real history. Or tap **📖 Read about it** for the sourced fact pack.
6. Everything you wake gets pinned to the **Memories** tab as a die-cut sticker you can replay and share.

No GPS at the venue? There's a **manual "Next stop"** control so the demo never stalls, and every stop ships a **pre-rendered era photo** so the rewind is instant even if the live render is slow.

---

## ✨ What's built

| Feature | What it does |
|---|---|
| 🗺️ **Map tab** | The Dalston loop on a live Mapbox map (plan-map fallback with no token). A GPS `ProximityEngine` wakes haunts as you approach; pins drop as photo-stickers. |
| 📸 **Camera tab** (the hero) | Live camera → snap → **era rewind** (image-to-image) → **vision classify** → talk or read. Iris-wipe reveal, grounded caption with sources, shareable postcard. |
| 🕰️ **Time Portal era dial** | Four grounded eras — **1890s** gaslight, **1943** Blitz, **1974** Cortinas, **2050** the modernists' promise. Each is a period-correct style card + a **composition lock** so only the *era* changes, not the street geometry. |
| 🔍 **Vision classify** | Names the 2–4 most prominent talkable subjects in your photo ("a cast-iron bollard", "a 1970s tower block") and routes the conversation to the right character/persona. |
| 🎙️ **Full-screen voice** | The character's sticker is the hero; a halo pulses while it speaks. Real-time two-way conversation, per-character British voices, subtitle-style captions, pause/resume. |
| 🧠 **Grudge memory** | Characters recur across the loop and remember you: a running ledger feeds callbacks like *"that's the third Victorian thing you've ignored today."* |
| 🖼️ **Memories tab** | Everything you woke, filed by day as die-cut stickers on a blue Dalston sky. Tap to relive the full render + who you met; share the moment. |
| 🚫 **No-hallucination guarantee** | No verified fact pack for a spot → the era dial **greys out** and the character stays quiet. Refusing to invent history is a feature, not a bug. |

---

## 🧩 How it works

The magic is one pipeline: **snap → rewind → classify → talk.**

```
        📷 Camera frame (base64 JPEG)
                 │
        ┌────────┴─────────┐
        ▼                  ▼
  POST /api/portal    POST /api/classify
  "rewind the         "what's in shot?"
   street to <era>"    2–4 talkable
        │               subjects
        ▼                  │
  1. cached pre-render     ▼
     (public/portal) ── instant, demo-safe
  2. gpt-image-2 img2img ─ grounded live rewind
  3. CSS era-tint ──────── theatre fallback
        │                  │
        └────────┬─────────┘
                 ▼
        Reveal + grounded caption (real sources)
                 │
     🎙️ Talk ───┴─── 📖 Read
     POST /api/voice-token        stop fact pack
     → ElevenLabs ConvAI          (verified facts
       (system prompt =            + live sources)
        character card
        + fact pack
        + session memory)
```

**Grounding is enforced, not decorative.** The portal prompt is assembled as `era style card + this location's verified facts + composition lock` (`packages/shared/src/grudge/portal.ts`). If a stop has no facts, `buildPortalPrompt` returns `null` and the API responds `422 grounding-required`. The voice character can *only* speak facts from its stop's fact pack — the comedy contract (`≤40 words`, one verifiable fact + one named present-day local per reply) is baked into the system prompt.

**API routes** (Hono server, `apps/server/src/index.ts`):

| Route | Purpose |
|---|---|
| `POST /api/portal` | Image-to-image era rewind of the captured frame (grounded). |
| `POST /api/classify` | Vision: the most prominent talkable subjects in shot. |
| `POST /api/voice-token` | Mints a short-lived ElevenLabs ConvAI session token. |
| `POST /api/story` · `/api/tts` · `/api/sticker` | Story text, speech, die-cut sticker cutouts. |
| `GET/POST /api/memories` · `GET /api/spots` · `GET /api/health` | Persistence + loop data + health check. |

The server runs **fully on mocks with no keys or DB** — every provider degrades gracefully so the app always boots.

---

## 🛠 Tech stack

| Layer | Tech |
|---|---|
| **Frontend** | React 18 + Vite, installable **PWA** (service worker, manifest) |
| **Server** | **Hono** on Node 20, single service that also serves the built PWA |
| **Era rewind** | OpenAI **gpt-image-2** image-to-image (`/v1/images/edits`), **Gemini** image fallback |
| **Vision** | OpenAI **gpt-5.4 vision** — object classification of the street photo |
| **Voice** | **ElevenLabs** conversational AI, per-character British voices |
| **Map** | **Mapbox GL** + a custom GPS `ProximityEngine` |
| **Story/text** | Gemini as a text/story provider; ElevenLabs for TTS |
| **Storage** | Postgres or in-memory (`DB_PROVIDER`); client also persists Memories to `localStorage` |
| **Deploy** | **Railway** (Nixpacks), one service, `/api/health` health check |

---

## 📂 Monorepo layout

pnpm workspace (`pnpm-workspace.yaml`): `packages/*` + `apps/*`.

```
LondonMax/
├── apps/
│   ├── web/                 # React + Vite PWA (@grudgemap/web)
│   │   ├── src/grudge/      # ── the Old Haunts app ──
│   │   │   ├── GrudgeApp.tsx            # 3-tab shell: Map · Camera · Memories
│   │   │   ├── TimePortal.tsx           # camera → snap → rewind → classify → talk/read
│   │   │   ├── GrudgeConversation.tsx   # full-screen voice takeover
│   │   │   ├── MemoriesCloud.tsx        # die-cut stickers on a blue sky, per day
│   │   │   └── memoryStore.ts           # localStorage memory diary
│   │   └── public/portal/   # pre-rendered era photos (demo-safe fallback)
│   ├── server/              # Hono API + static PWA host (@grudgemap/server)
│   └── mobile/              # Expo shell (@grudgemap/mobile)
├── packages/
│   ├── shared/src/grudge/   # ── the content + rules engine ──
│   │   ├── stops.ts         # the 6-stop Dalston loop
│   │   ├── portal.ts        # era cards + grounded prompt assembler
│   │   ├── prompt.ts        # the comedy/grounding contract
│   │   └── characters/      # the-bollard.ts · the-postbox.ts · edith.ts
│   ├── ai/                  # provider adapters (OpenAI, Gemini, ElevenLabs, mock)
│   └── db/                  # Postgres / in-memory storage
└── content/                 # character authoring path (see below)
```

---

## 🚀 Getting started

```bash
# prerequisites: Node >= 20, pnpm 10 (corepack enable)
pnpm install

# build workspace packages, then run web + server together
pnpm dev
#   web    → http://localhost:5173
#   server → http://localhost:8787   (API under /api)

# or run each side on its own
pnpm dev:web
pnpm dev:server

pnpm typecheck
```

With **zero env vars** the server boots on mocks so you can click through the whole UI. Add keys to unlock the live models.

### Environment variables (names only — never commit values)

Create `.env.local` in the repo root:

| Var | Enables |
|---|---|
| `OPENAI_API_KEY` | Era rewind (gpt-image-2) + vision classify (gpt-5.4 vision) |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID` | Two-way voice conversations |
| `VITE_MAPBOX_ACCESS_TOKEN`, `VITE_MAPBOX_STYLE` | Live Mapbox map (falls back to plan map without) |
| `GEMINI_API_KEY` | Story/text provider + image rewind fallback |
| `AI_STORY_PROVIDER`, `AI_TTS_PROVIDER`, `AI_STICKER_PROVIDER` | Pick provider vs. mock per capability |
| `DB_PROVIDER` | `memory` (default) or `postgres` |

> 🔒 **No real secrets live in this repo.** Keys are injected at runtime (`.env.local` locally, Railway env in production). Never paste key values into code or docs.

---

## ✍️ The content authoring path (the reusable asset)

The characters aren't hard-coded strings — they're an **authorable, type-checked content system**. That's what lets Old Haunts extend past Dalston to any London street without touching app code.

- **`content/`** — the authoring brief, schema, and sources. `content/AGENT_BRIEF.md` is a complete spec (for a human *or* an agent) for writing grounded, funny, sourced characters. `content/areas/` holds per-borough source data across **33 London boroughs**.
- **`packages/shared/src/grudge/characters/`** — the typed cast. `the-bollard.ts` is the **gold-standard reference**: a `GrudgeCharacter` + per-stop `FactPack`s, each fact carrying a real `source` and `sourceKind` (`historic-england`, `blue-plaque`, `wikidata`, `archive`, `local-press`). Malformed content fails the build.
- **The sourcing rule:** one fact = one checkable claim. `verified: true` only when every source is confirmed. If you can't verify it, you cut it — *every line spoken on stage traces to a verifiable fact.*

Author a new character by copying `the-bollard.ts`'s shape, filling 8–12 sourced facts, and running `pnpm --filter @grudgemap/shared build`. New haunt, no new code.

---

## 🧪 How individual characters were evaluated

Before trusting an LLM to "sound like" a real historical figure, it's tested against what that person actually said — not judged on vibes.

For each of the 26 named figures in the wider blue-plaque character map (`BLUE_PLAQUE_CHARACTER_MAP.md`), an eval pipeline:

1. **Research** — gathers real, sourced public statements (speeches, letters, published writing, interviews, trial testimony), each with the context it was said in and how the public reacted at the time.
2. **Split** — holds out the last ~25% of each character's statements as a hidden test set never shown to the next step.
3. **Derive a persona** — writes a voice profile from the training split *only* (tone, vocabulary, recurring stances, "would never say") — this is the artifact the `historical-voice` Claude Skill (`.claude/skills/historical-voice/SKILL.md`) consumes to speak as a character.
4. **Generate** — for each held-out situation, generates what that person would plausibly have said, given only the persona and the situation — never the real quote.
5. **Judge** — scores the generated line against the real quote + real public reaction on voice fidelity, content fidelity, and plausibility (1–5 each).

**Result:** a weighted mean of **3.89 / 3.48 / 3.86** (voice / content / plausibility) across 99 judged held-out statements. Best fits were figures with large first-person written records (Sigmund Freud, Oscar Wilde, John Keats, George Orwell); weakest fits split between genuinely thin historical record (Noor Inayat Khan — a covert wartime agent with almost no surviving first-person public statements, only third-party accounts) and a harder-to-pin-down voice (Charlie Chaplin, despite ample source material).

Data lives in `eval/data/<character>/{raw,train,test}.json`, derived voice profiles in `eval/personas/`, full judged results in `eval/results/`, and the complete methodology, per-character scores, and caveats are in **`eval/REPORT.md`**.

---

## 📜 The cast

| Character | Who | Grievance |
|---|---|---|
| 🪨 **The Bollard** | Cast-iron street furniture, 1817 pattern | Believes it's critical civic infrastructure. Nobody has *genuinely* looked at it since 1974. |
| 📮 **The Postbox** | Victorian VR-cipher pillar box | Considers email a passing fad. Ranks itself above the church. |
| 👻 **Edith** | 1970s Dalston squatter's ghost | Her local is now a specialty coffee shop. She has priced the flat white. |

They recur across the six stops — which is exactly what makes the memory callbacks land.

---

*Old Haunts — the streets remember, even when you don't.*
