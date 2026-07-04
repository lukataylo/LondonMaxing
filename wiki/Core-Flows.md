# Core Flows

## Product state machine

```
         ┌──────────────────────────────────────────────────────────────┐
         │                        MAP (idle)                            │
         │  Mapbox map loads, user dot shown, figure pins rendered      │
         │  Proximity engine running silently in background             │
         └──────────────────────────┬───────────────────────────────────┘
                                    │  3 consecutive GPS fixes within
                                    │  unlockRadius (default: 40 m)
                                    ▼
         ┌──────────────────────────────────────────────────────────────┐
         │                     PIN ACTIVATED                            │
         │  Nearest pin glows, scales up, plays ambient sound          │
         │  "You're near [Figure Name]" banner appears                  │
         └──────────────────────────┬───────────────────────────────────┘
                                    │  user taps the pin
                                    ▼
         ┌──────────────────────────────────────────────────────────────┐
         │                      STORY MODE                              │
         │  Glass card slides up                                        │
         │  POST /api/story → Gemini writes narrative                   │
         │  POST /api/tts   → ElevenLabs streams audio in figure's voice│
         │  Story plays with live transcript                            │
         │  "Talk to me" button appears during / after playback         │
         └──────────┬────────────────────────┬────────────────────────-─┘
                    │ tap "Talk to me"        │ story ends / skip
                    ▼                         ▼
 ┌────────────────────────┐     ┌─────────────────────────────────────┐
 │   CONVERSATION MODE    │     │          CHALLENGE                  │
 │                        │     │  Photo challenge: open camera →     │
 │  Live voice dialogue   │     │  capture → POST /api/sticker →      │
 │  gpt-4o-mini responds  │     │  transparent PNG sticker saved      │
 │  in character via      │     │                                     │
 │  ElevenLabs            │     │  Walk challenge: GPS distance meter  │
 │                        │     │  ticks until target reached         │
 │  User can ask anything │     └──────────────────┬──────────────────┘
 │  "What was it like     │                        │ challenge complete
 │  writing your first    │                        ▼
 │  algorithm?"           │     ┌─────────────────────────────────────┐
 │                        │     │          MEMORY / SCRAPBOOK         │
 │  Tap "Done talking"    │     │  Sticker + timestamp + location     │
 │  to proceed to         │─────►  added to day-grid                  │
 │  challenge             │     │  Shareable PNG export               │
 └────────────────────────┘     └─────────────────────────────────────┘
```

---

## 1. Map screen

- Mapbox GL JS renders the basemap (light style, ~45° pitch for 3D building extrusions)
- `packages/shared` proximity engine runs on a `watchPosition` feed (web) or native `Location.watchPositionAsync` (Expo, bridged via `postMessage`)
- Each figure has its own pin artwork in `apps/web/public/pins/`
- **Demo unlock button** bypasses GPS — injects a synthetic fix at the selected figure's coordinates

**GPS accuracy handling:**
```
fix.accuracy > 50 m  → discard
fix.accuracy ≤ 50 m  → Kalman smooth → check distance
distance ≤ unlockRadius (40 m) for 3 consecutive fixes → activate
distance > 70 m (relock buffer) → deactivate
```

---

## 2. Story flow

1. User taps an activated pin
2. `POST /api/story { figureId, lat, lng, timeOfDay }` — Gemini 2.5 Flash returns `{ title, narration, challenge }` via structured output
3. Glass card animates up; title appears; `POST /api/tts { text, voiceId }` streams MP3 from ElevenLabs
4. Audio auto-plays (started on the user tap — required for iOS autoplay)
5. Live transcript scrolls below the figure illustration
6. "Talk to me" button reveals at 50% through story or after it ends

**Caching:** `(figureId)` keyed server-side — repeat visits hit the cache, not the Gemini/ElevenLabs quota.

---

## 3. Voice conversation flow

Grudge Map uses ElevenLabs Conversational AI for real-time, bidirectional spoken dialogue:

```
User mic  →  [browser MediaStream / expo-audio]
          →  ElevenLabs agent (configured with figure system prompt)
          →  gpt-4o-mini generates in-character reply
          →  ElevenLabs synthesises reply in figure's voice
          →  audio plays back to user
          →  transcript updated in UI
```

Key implementation details (`apps/web/src/voiceConversation.ts`):
- The ElevenLabs agent is initialised with a **figure-specific system prompt** so every character maintains consistent persona, period-accurate knowledge, and British register
- Acoustic echo cancellation is enabled to prevent mic pickup of the speaker output
- The session ends when the user taps **Done talking**, which transitions to the challenge

---

## 4. Photo challenge → sticker

1. User is handed a location-specific prompt (e.g. "Take a photo at Ada Lovelace's front door")
2. Camera opens via `<input type="file" capture>` (web) or `expo-image-picker` (native)
3. Photo sent to `POST /api/sticker { imageBase64 }`
4. `gpt-image-1` renders it as a period-appropriate illustrated sticker (e.g. Victorian portrait style)
5. Sticker PNG returned and stored in `Memory` record
6. Confetti animation plays; sticker previewed

**Walk challenge variant:**
- Cumulative GPS distance tracked by the proximity engine's fix stream
- Progress bar animates toward target (default 200 m)
- On completion, a generated "walker sticker" is awarded without a photo

---

## 5. Scrapbook / memory view

- Memories are stored client-side in IndexedDB (web) / AsyncStorage (Expo)
- Grouped by `YYYY-MM-DD` local date
- Each day card shows: sticker collage, figure names visited, walk distance total
- Shareable as a PNG via the Web Share API

---

## 6. Guided tours

- 10 curated multi-stop walking tours (e.g. "Victorian London", "WWII Commanders", "Suffragettes of Westminster")
- Each tour renders a route polyline on the Mapbox map
- Stops include both figures and **partner venues** (cafés, bookshops, attractions)
- Progress persists across sessions; users can pause and resume a tour
- Partner stops surface a short description + deep-link to the venue's booking or menu page
