# Architecture

## System overview

```
┌──────────────────────────────┐      ┌──────────────────────────────┐
│  PWA  (primary client)       │      │  iOS app  (Expo shell)        │
│  React + Vite + Mapbox GL    │      │  Expo SDK 53                  │
│  Full UI, game loop, voice   │      │  WebView embeds the PWA       │
│  Installable, offline-ready  │      │  Native bridges only:         │
└────────────┬─────────────────┘      │   expo-location  (GPS)        │
             │                        │   expo-image-picker (camera)  │
             │                        │   expo-audio     (TTS play)   │
             │                        │   expo-blur      (glass UI)   │
             │                        └──────────────┬────────────────┘
             │  HTTPS / JSON                          │  postMessage
             └────────────────────┬───────────────────┘
                                  ▼
                   ┌──────────────────────────────┐
                   │  Hono API  (Railway)          │
                   │                              │
                   │  POST /api/story   → Gemini  │
                   │  POST /api/tts     → 11Labs  │
                   │  POST /api/converse→ OpenAI  │
                   │  POST /api/sticker → OpenAI  │
                   │  GET  /*           → PWA     │
                   └──────────┬───────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         Gemini 2.5      ElevenLabs      OpenAI
         Flash           Flash v2.5      gpt-4o-mini
         (stories)       (voice)         gpt-image-1
```

**Design principle:** the PWA is the single source of UI truth. The Expo app reuses 100% of it via WebView and only adds native superpowers where the browser falls short. The API server is the sole holder of secrets and the only place that calls third-party AI.

---

## Monorepo layout

```
grudgemap/                      ← pnpm workspace root
├── apps/
│   ├── web/                   ← @grudgemap/web   — Vite + React PWA
│   │   ├── src/
│   │   │   ├── map/           ← Mapbox integration, pin rendering
│   │   │   ├── screens/       ← Map, Story, Challenge, Scrapbook, Tour screens
│   │   │   ├── voiceConversation.ts   ← ElevenLabs real-time conversation
│   │   │   ├── sticker.ts     ← photo challenge + sticker generation
│   │   │   ├── auth.ts        ← magic-link session management
│   │   │   └── api.ts         ← typed API client (uses @grudgemap/shared contracts)
│   │   └── public/
│   │       ├── logo.svg
│   │       └── pins/          ← per-figure pin artwork
│   ├── mobile/                ← @grudgemap/mobile — Expo SDK 53 shell
│   └── server/                ← @grudgemap/server — Hono on Railway
│       └── src/index.ts       ← all routes, AI provider calls
├── packages/
│   ├── shared/                ← @grudgemap/shared — types, proximity, API contracts, prompts
│   ├── ai/                    ← @grudgemap/ai     — provider interfaces
│   └── db/                    ← @grudgemap/db     — in-memory dev store + Postgres seam
├── wiki/                      ← this wiki (copy to GitHub wiki repo to publish)
└── pnpm-workspace.yaml
```

---

## Data model

```ts
// packages/shared/types.ts

type HistoricalFigure = {
  id: string;
  name: string;               // "Ada Lovelace"
  lat: number; lng: number;   // exact historical address
  unlockRadius: number;       // metres — default 40
  era: string;                // "Victorian", "WWII", ...
  voiceId: string;            // ElevenLabs voice ID
  seed?: string;              // flavour text fed to Gemini
  tourIds?: string[];         // tours this figure appears in
};

type Story = {
  figureId: string;
  title: string;
  narration: string;          // ~150 words, first person, British voice
  audioUrl?: string;          // cached ElevenLabs MP3
  challenge: Challenge;
};

type Challenge =
  | { type: 'photo'; instruction: string }
  | { type: 'walk';  instruction: string; targetMeters: number };

type Memory = {
  id: string;
  day: string;                // 'YYYY-MM-DD' local
  figureId: string;
  photoDataUrl: string;
  stickerUrl: string;         // gpt-image-1 rendered PNG
  caption?: string;
  lat: number; lng: number;
  createdAt: number;
};

type Tour = {
  id: string;
  title: string;              // "Victorian London"
  stops: TourStop[];
  estimatedMinutes: number;
};

type TourStop = {
  figureId?: string;
  partnerId?: string;         // café / attraction
  description: string;
  lat: number; lng: number;
};
```

---

## Proximity engine

The engine in `packages/shared/proximity.ts` handles the full GPS pipeline on both clients:

```
navigator.geolocation.watchPosition (web)
  └─► accuracy gate  (discard fixes > 50 m accuracy)
        └─► Kalman / rolling-average smoother
              └─► turf.distance vs each figure's coordinates
                    ├─► UNLOCK  if distance ≤ unlockRadius for 3 consecutive fixes
                    └─► RELOCK  if distance > unlockRadius + 30 m hysteresis buffer
```

The Expo app feeds native `Location.watchPositionAsync` fixes into the WebView via `postMessage`, so the same engine handles both clients.

**Debug teleport:** a long-press on the map injects a synthetic GPS fix, bypassing the real location pipeline — essential for indoor demos and hackathon judging.

---

## Backend API contract

| Endpoint | Body | Response | Provider |
|----------|------|----------|----------|
| `POST /api/story` | `{figureId, lat, lng, timeOfDay}` | `{title, narration, challenge}` | Gemini 2.5 Flash |
| `POST /api/tts` | `{text, voiceId}` | `audio/mpeg` stream | ElevenLabs Flash v2.5 |
| `POST /api/converse` | `{figureId, messages[]}` | `{reply, audioUrl}` | gpt-4o-mini + ElevenLabs |
| `POST /api/sticker` | `{imageBase64}` | `{stickerUrl}` PNG | gpt-image-1 |
| `GET /api/figures` | — | figure list + coordinates | Railway Postgres / seed JSON |
| `GET /api/tours` | — | tour list with stops | Railway Postgres / seed JSON |
| `GET /*` | — | PWA static bundle | Railway static |

All responses are cached keyed on `(figureId)` or `hash(text)` to stay within API free tiers during early scale.

---

## Deployment

The API server and PWA static build are both served from a single Railway service. Environment variables are set in the Railway dashboard. See [RAILWAY_HANDOFF.md](../RAILWAY_HANDOFF.md) for provisioning details.
