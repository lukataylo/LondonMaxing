# Architecture — "Grudge Map" (working title)

> Pokémon Go for ghost stories. A soft-white glassmorphic map of nearby haunted spots. Walk into one,
> and storytelling mode activates: Gemini conjures a place-specific ghost story, ElevenLabs narrates it,
> and you're handed a challenge (take a selfie, go on a walk). Everything you photograph becomes a sticker,
> collected into a **day-by-day memory** view.

---

## 1. System overview

```
┌──────────────────────────┐     ┌──────────────────────────┐
│   PWA  (primary build)    │     │  Expo Go app (shell)      │
│  React + Vite + maplibre  │     │  react-native-webview ───┼──► embeds the PWA
│  - full UI & game loop    │     │  native bridges only:     │
│  - HTTPS, installable     │     │   expo-location (GPS)     │
└────────────┬─────────────┘     │   expo-image-picker (cam) │
             │                    │   expo-audio (TTS play)   │
             │                    │   expo-blur (native glass)│
             │                    └────────────┬─────────────┘
             │   HTTPS/JSON                     │ postMessage bridge
             └──────────────┬───────────────────┘
                            ▼
              ┌──────────────────────────────┐
              │  Backend (Hono on Railway)    │   holds ALL secret keys
              │  POST /api/story   → Gemini   │
              │  POST /api/tts     → 11Labs   │
              │  POST /api/sticker → bg-remove│
              │  GET  /            → serves PWA│
              └──────────────────────────────┘
                  │            │            │
            Gemini 2.5     ElevenLabs    @imgly bg-removal
             flash         flash v2.5    (+ Nano Banana stretch)
```

**Why this shape:** the PWA is the demoable artifact and the single source of UI truth. The Expo Go app
reuses 100% of it via WebView and only adds native superpowers where the browser is weak (GPS accuracy,
camera, reliable audio autoplay, native blur). The backend is the only place secrets live and is the only
component both clients talk to. This is what makes "one codebase, two targets, no native builds, ships
today" actually hold. See `RESEARCH.md §1`.

---

## 2. Repo layout (pnpm workspaces monorepo)

```
grudge-map/
├── apps/
│   ├── web/         # Vite + React PWA  (the experience)
│   ├── mobile/      # Expo SDK 53+ shell (WebView + native bridges)
│   └── server/      # Hono API on Railway (keys, Gemini, 11Labs, sticker, serves web build)
├── packages/
│   └── shared/      # TS types, story prompt+schema, proximity engine, API client
├── package.json     # workspaces
└── *.md             # this doc set
```

`packages/shared` is the leverage: the **proximity engine**, **types**, **API client**, and **Gemini
prompt/schema** are written once and imported by `web` (and `server` for types). `mobile` mostly defers to
the WebView, so it needs little shared code.

---

## 3. Core game loop (state machine)

```
        ┌─────────┐   within radius for K fixes    ┌───────────┐
        │  MAP    │ ─────────────────────────────► │ ACTIVATED │
        │ (locked)│ ◄───────────────────────────── │ pin glows │
        └─────────┘   beyond radius+buffer (relock) └─────┬─────┘
                                                          │ tap
                                                          ▼
   ┌─────────┐   capture/walk done   ┌──────────┐   story ends   ┌────────────┐
   │ MEMORY  │ ◄──────────────────── │ CHALLENGE │ ◄───────────── │ STORYTELLING│
   │ day-grid│                       │ selfie/walk│                │ Gemini+TTS  │
   └─────────┘                       └──────────┘                 └────────────┘
```

1. **MAP (locked).** Glassmorphic OpenFreeMap-Liberty map, user dot, nearby ghost pins (3D icons), faded
   top/bottom edges. A `DEBUG TELEPORT` long-press sets simulated position (essential — `RESEARCH.md §3`).
2. **ACTIVATED.** The proximity engine (watchPosition → accuracy filter → smooth → turf.distance →
   2–3 consecutive fixes → hysteresis) flips the nearest pin to "activated" (glow/scale animation).
3. **STORYTELLING.** Tap the activated pin → `POST /api/story {lat,lng,placeName,timeOfDay}` → Gemini
   returns `{title, narration, challenge}` → `POST /api/tts {text}` → glass story card narrates with
   ElevenLabs audio (must start on the tap = user gesture, for iOS autoplay).
4. **CHALLENGE.** Story hands off a challenge:
   - **selfie**: open camera → photo → `POST /api/sticker` cuts it out → saved as a memory.
   - **walk**: track cumulative GPS distance until target met (reuses the proximity engine's fix stream).
5. **MEMORY.** Captures persist locally (no auth), grouped by day → sticker-collage grid.

---

## 4. Data model

```ts
// packages/shared/types.ts
type GhostSpot = {
  id: string;
  title: string;            // "The Weeping Lady of Dock St"
  lat: number; lng: number;
  unlockRadius: number;     // metres, default 40
  icon: string;             // 3D marker asset key
  seed?: string;            // optional flavour fed to Gemini
};

type Story = {
  spotId: string;
  title: string;
  narration: string;        // ~120-160 words, 2nd person, spooky
  challenge: Challenge;
  audioUrl?: string;        // cached ElevenLabs result
};

type Challenge =
  | { type: 'selfie'; instruction: string }
  | { type: 'walk'; instruction: string; targetMeters: number };

type Memory = {
  id: string;
  day: string;              // 'YYYY-MM-DD' (local)
  spotId: string;
  photoDataUrl: string;     // original
  stickerUrl: string;       // cut-out PNG
  caption?: string;
  lat: number; lng: number;
  createdAt: number;
};
```

**Persistence:** client-side, **no auth** for the hackathon. Web → IndexedDB/localStorage; Expo →
AsyncStorage (or just the WebView's storage since it embeds the PWA). Ghost spots: a static seed JSON +
optional dynamically-generated spots near the user. Optional Railway Postgres only if multi-device is a
stretch goal.

---

## 5. Proximity engine (the part most clones get wrong — `RESEARCH.md §3`)

```ts
// packages/shared/proximity.ts  (pseudocode)
const ACCURACY_MAX = 50;     // discard worse fixes
const UNLOCK_M = 40, RELOCK_M = 70;   // hysteresis
const NEEDED_HITS = 3;       // consecutive in-range fixes to trigger

function onFix(fix, spots, state) {
  if (fix.accuracy > ACCURACY_MAX) return;          // 1. accuracy gate
  const p = kalman.update(fix);                      // 2. smooth (kalmanjs / rolling avg)
  for (const s of spots) {
    const d = turf.distance([p.lng,p.lat], [s.lng,s.lat], {units:'meters'});
    const active = state.active.has(s.id);
    if (!active && d <= s.unlockRadius) {
      state.hits[s.id] = (state.hits[s.id]||0) + 1;  // 3. debounce by count
      if (state.hits[s.id] >= NEEDED_HITS) activate(s);
    } else if (active && d > RELOCK_M) {             // 4. hysteresis relock
      deactivate(s); state.hits[s.id] = 0;
    } else if (!active) state.hits[s.id] = 0;
  }
}
```

- Web feed: `navigator.geolocation.watchPosition(cb, err, {enableHighAccuracy:true, maximumAge:2000})`.
- Expo feed: `Location.watchPositionAsync({accuracy:High, distanceInterval:5, timeInterval:2000})`,
  pushed into the WebView via `postMessage` so the **same engine** runs inside the PWA.
- **Teleport debug** simply injects a synthetic fix into `onFix`.

---

## 6. Backend API contract

| Endpoint | Body | Returns | Engine |
|---|---|---|---|
| `POST /api/story` | `{lat,lng,placeName?,timeOfDay,seed?}` | `{title,narration,challenge}` | `@google/genai` `gemini-2.5-flash`, structured output |
| `POST /api/tts` | `{text,voiceId?}` | `audio/mpeg` (or `{url}`) | `@elevenlabs/elevenlabs-js` `eleven_flash_v2_5`, `mp3_22050_32` |
| `POST /api/sticker` | `{imageBase64}` | `{stickerUrl}` PNG transparent | `@imgly/background-removal-node` (+ white outline) |
| `GET /*` | — | the built PWA | static |

- **Caching:** key `/api/story` and `/api/tts` by `(spotId)` / `(hash(text))` to stay inside free tiers
  (`RESEARCH.md §4`). Pre-generate stories+audio for the demo spots at deploy time.
- Reverse-geocode `lat,lng → placeName` via Nominatim/MapTiler to give Gemini context (optional; can pass
  raw coords).
- Secrets: `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` as Railway env vars.

### Gemini story prompt (structured)
```
System: You are a master of local ghost lore. Given a real place, invent a short, eerie, PG-13 ghost
story that feels specific to that spot. Second person, present tense, ~140 words. Then issue ONE playful
real-world challenge the player can do right now.
responseSchema: { title:string, narration:string,
  challenge:{ type:'selfie'|'walk', instruction:string, targetMeters?:number } }
```

---

## 7. UI / aesthetic system (`RESEARCH.md §4`)

- **Map:** OpenFreeMap Liberty style (light, 3D building extrusions, no key). Pitch ~45° for the 3D feel.
- **Glass cards:** `background: rgba(255,255,255,.55); backdrop-filter: blur(14px) saturate(180%)` +
  `-webkit-` prefix + `@supports not` opaque fallback; 20 px radius; soft shadow + inset highlight.
- **Faded edges:** `mask-image: linear-gradient(to bottom, transparent, #fff 12%, #fff 88%, transparent)`
  on the map container; or stacked progressive-blur layers for the premium look.
- **3D ghost markers:** PNG/Lottie sprites with a float/bob animation (framer-motion on web).
- **Expo parity:** `expo-blur` BlurView + `expo-linear-gradient` + `@react-native-masked-view` reproduce
  glass + faded edges natively around the WebView chrome (status/tab bars).

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| GPS jitter / false triggers | Accuracy gate + Kalman smoothing + 3-consecutive-fix debounce + hysteresis (§5) |
| Can't demo without walking | **Teleport debug mode** (long-press map) — build this first |
| Expo Go native limits | WebView-of-PWA strategy; only bundled modules (`RESEARCH.md §1`) |
| iOS audio autoplay blocked | Start narration on the pin **tap** (user gesture); native uses `expo-audio` |
| Safari `backdrop-filter` | `-webkit-` prefix + `@supports` opaque fallback |
| Geolocation needs HTTPS | Railway serves HTTPS; PWA must be installed over HTTPS |
| Leaked API keys | Keys live only on backend; clients call `/api/*` |
| ElevenLabs/Gemini free limits | Cache by spot/text; pre-generate demo content; short narration; `flash-lite` for small calls |
