# Grudge Map

> London's street furniture and dead locals talk to you as you walk. They
> remember you, they hold grudges, and everything they say is grounded in real
> history.

**Londonmaxxing 003 · Ramen Space, Dalston · PWA + Expo** (Swift dropped; the
app ships as a web PWA wrapped in an Expo shell).

A PWA + Expo shell built around a map, GPS `ProximityEngine`, and an ElevenLabs
conversational-voice hook, with a character + content layer authored to the
Grudge Map PRD: talking objects and ghosts with fact-packs, session memory, and
a grudge ledger.

## Run it

```bash
corepack pnpm install
corepack pnpm --filter @grudgemap/shared build   # build the content package once
corepack pnpm dev:web                       # PWA at http://localhost:5173
# voice needs a server with ElevenLabs creds:
corepack pnpm dev:server                     # needs ELEVENLABS_API_KEY + ELEVENLABS_AGENT_ID
# Expo shell (loads the PWA URL from apps/mobile/.env):
corepack pnpm dev:mobile
```

Copy `.env.example` → `.env.local` and set `ELEVENLABS_API_KEY` +
`ELEVENLABS_AGENT_ID`. In the ElevenLabs dashboard enable **Security → Overrides**
for system prompt, first message, language, and voice (the per-character prompt is
injected as an override at runtime).

Without a server the map, walk, camera-wake, and ledger all still work — only the
live voice needs the ElevenLabs agent.

## What's built (mapped to the PRD)

| PRD | Status | Where |
|---|---|---|
| F1 Walk session + GPS triggers | ✅ | `apps/web/src/grudge/GrudgeApp.tsx` (shared `ProximityEngine` over the 6-stop Dalston loop) |
| F2 Camera wake | ✅ (MVP) | camera overlay + object-class picker → wakes nearest matching stop. On-device ML classification is the stretch. |
| F3 Two-way voice | ✅ | `GrudgeConversation.tsx` + `voiceConversation.ts` (ElevenLabs ConvAI, prompt/first-message/voice overrides) |
| F4 Session memory | ✅ | `SessionMemory` injected into the system prompt; characters make audible callbacks |
| F5 Grounded retrieval (fact packs) | ✅ engine / 🚧 content | `buildGrudgeSystemPrompt` restricts history to the stop's fact pack; packs authored in `packages/shared/src/grudge/characters/*` |
| F6 Grudge ledger | ✅ | accumulating, shareable ledger in `GrudgeApp.tsx` |
| §9 Manual stop-advance (poor GPS) | ✅ | "Next stop →" on the bottom sheet |

The three MVP characters (**The Bollard**, **Edith**, **The Postbox**) recur
across the six stops so the memory callbacks land.

## Architecture (content layer)

```
packages/shared/src/grudge/
  types.ts              # GrudgeCharacter, FactPack, Fact, Stop, Grudge, SessionMemory
  stops.ts              # the 6-stop Dalston loop from Ramen Space
  prompt.ts             # buildGrudgeSystemPrompt — enforces the comedy constraints
  session.ts            # ledger + memory helpers
  characters/
    the-bollard.ts      # ✅ fully-worked reference character + fact packs
    edith.ts            # 🚧 persona done, fact packs stubbed
    the-postbox.ts      # 🚧 persona done, fact packs stubbed
apps/web/src/grudge/
  GrudgeApp.tsx         # the walk: map, proximity, camera-wake, sheet, ledger
  GrudgeConversation.tsx# live voice, injects fact pack + memory, banks grudges
```

## Content pipeline → the asset (PRD §11)

The character cards + verified fact packs are the reusable asset. The authoring
path for another agent (or a human) is in **[`content/`](./content/README.md)** —
start with [`content/AGENT_BRIEF.md`](./content/AGENT_BRIEF.md). The Bollard is the
worked reference; Edith and the Postbox's fact packs are the next job, plus walking
the loop to correct the six coordinates.

Validate content at any time: `corepack pnpm --filter @grudgemap/shared build`.
