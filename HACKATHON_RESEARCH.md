# Ghost Hunt App — Hackathon Technical Intelligence Report
> Research from real GitHub repos, issues, and PRs. Last updated: 2026-06-13.

---

## Concept Summary

**"Pokemon Go for Ghosts"** — a location-based storytelling + challenge app.

- Map view (Yandex Maps / Apple Maps aesthetic): 3D icons, soft white UI, glassmorphism, faded top/bottom blur
- Enter a location radius → ghost storytelling activates (ElevenLabs TTS narration)
- Challenges: take a selfie, go for a walk
- Gemini AI for story generation + selfie analysis
- Day-by-day memory view: photos → generated stickers (RedNote trend)
- Ships as PWA + Expo Go / development build

---

## 1. Similar GitHub Projects — Learnings

### `Traviskn/react-native-exponent-pokemon-go`
- Even a "demo-only" Pokemon Go clone in Expo needed 5+ native APIs simultaneously (location, camera, gyro, animation, gestures). Complexity explodes fast.
- Archived 2023 — Expo SDK changes made it unmaintainable. Build with SDK upgrade headroom.

### `wellsousaaa/PokemonGO-clone`
- Web-only (ReactJS + Supabase + HERE Maps). HERE Maps is a free tile provider alternative.
- Web GPS via `navigator.geolocation` is simpler but loses native accuracy.

### `pathakmukul/Gemini-LIVE-API-Bidirectional-Audio-in-React-Native`
- **Critical:** `expo-av` audio sounds fragmented with streaming APIs. "For seamless streaming, a lower-level audio API or native module would be required."
- Acoustic echo cancellation (AEC) required to prevent mic pickup of speaker output.
- Architecture: microphone → AudioInputService → WebSocketService → Gemini → AudioOutputService → speakers.

### `kiarashplusplus/expo-gemini-live` (Pipecat + Gemini + Daily.co)
- **Expo Go does not work** — Daily.co native modules require `npx expo prebuild`.
- Gemini Live only supports TEXT and AUDIO modalities — no VIDEO yet.
- Pattern: Python FastAPI backend handles all AI pipeline; mobile is thin UI + audio transport. Keeps API keys off device.

### `elevenlabs/packages` (Official ElevenLabs React Native SDK)
- **Expo Go is explicitly not supported** — WebRTC native dependencies.
- Android `getUserMedia` TypeError (Issue #150): microphone fails in Android WebView without proper WebRTC setup.
- Simple TTS (not conversational): use REST API — works without native modules.

### `atlj/react-native-background-remover`
- Background removal for selfie-to-sticker uses on-device MLKit (Android) / Vision framework (iOS).
- **iOS requires real physical device (iOS 15+)** — simulator returns original image unchanged.
- Android works on emulators.

### MapLibre in Expo (Map hybrid research)
- `react-native-maps` has **no web support** — ruled out for PWA+native hybrid.
- `rnmapbox` web support is "overly optimistic" — do not trust.
- **Working pattern:** `maplibre-react-native` (native) + `react-map-gl` + `maplibre-gl-js` (web), split via `.tsx` / `.web.tsx` filename convention.
- Use MapTiler as tile provider (free tier, no proprietary license).

### Gemini + Expo Camera (photo memory capture)
- Full image analysis pipeline possible in ~8 hours: `expo-image-picker` → base64 → Gemini REST → JSON.
- **`gemini-1.5-flash` was removed from `v1beta` mid-project** — pin model versions.
- Use `responseMimeType: 'application/json'` + `responseSchema` — eliminates JSON parse failures entirely.
- Compress images to 70% JPEG quality, keep under 1MB.

---

## 2. Common Bugs by Category

### GPS / Geofencing

| Bug | Severity | Fix |
|-----|----------|-----|
| Android geofencing fires on every app open (expo/expo #33433) | HIGH | Deduplicate events on startup |
| Android doze mode kills background tasks after ~10 min (expo/expo #21895) | HIGH | Use `transistorsoft` or foreground service |
| Duplicate geofence enter/exit events on launch (expo/expo #25875) | HIGH | Filter events with 5s startup debounce |
| iOS background location stops after ~10 min screen locked | HIGH | Use `distanceFilter`, foreground service |
| iOS `requestBackgroundPermissionsAsync()` requires two calls (expo/expo #33911) | MED | Add retry logic |
| Indoor GPS accuracy: ~5m outdoors, worse indoors | LOW | Show "approximate location" UX |

### Maps

| Bug | Severity | Fix |
|-----|----------|-----|
| `react-native-maps` — no web support | BLOCKER | Use MapLibre split pattern |
| `react-native-maps` — 20+ custom markers freeze app | HIGH | Use Skia Atlas batching or simple markers |
| `tracksViewChanges={false}` breaks image rendering in markers | MED | Pre-render as static assets |
| `rnmapbox` dep resolution failures (Android, Oct 2024) | HIGH | Use MapLibre instead |
| MapLibre requires two packages for native+web | MED | Plan split from day 1 |

### Camera / Selfie

| Bug | Severity | Fix |
|-----|----------|-----|
| `expo-camera` black screen on Android bare workflow (expo/expo #34376, unresolved) | HIGH | Use `react-native-vision-camera` for dev builds |
| iOS camera remount black screen on new architecture (expo/expo #31597) | MED | Known issue, use Vision Camera |
| `atlj/react-native-background-remover` — iOS simulator returns original image | MED | Test only on real device |

### AI APIs

| Bug | Severity | Fix |
|-----|----------|-----|
| `gemini-1.5-flash` removed from `v1beta` without redirect | HIGH | Pin `gemini-2.0-flash`, add error handling |
| Gemini without `responseSchema` returns markdown-wrapped JSON | HIGH | Always use `responseMimeType + responseSchema` |
| ElevenLabs SDK — Android `getUserMedia` TypeError (Issue #150) | HIGH | Use REST API for TTS, not SDK |
| `expo-av` streaming audio fragmentation | MED | Pre-buffer full audio before playback |
| Gemini Live VIDEO modality not yet available | LOW | Audio + text only |

### PWA Limitations

| Bug | Severity | Fix |
|-----|----------|-----|
| iOS Safari geolocation throttled — returns error code 2 after refresh, blocks 5 min | HIGH | Cache last position, retry with backoff |
| EU DMA (March 2024): PWAs no longer standalone on iOS in EU | HIGH | Frame PWA as secondary experience |
| Background geofencing in PWA — not possible | BLOCKER | PWA = foreground-only location |
| `getUserMedia` in iOS PWA requires HTTPS + explicit permission | MED | Ensure HTTPS from day 1 |

---

## 3. Architecture Recommendations

### Map Layer — Platform Split Pattern
```
Native (iOS/Android): maplibre-react-native + MapTiler tiles
Web (PWA):            react-map-gl + maplibre-gl-js + MapTiler tiles
File split:           MapView.tsx (native), MapView.web.tsx (web)
Location logic:       Shared utils, passed as props — no platform code in map component
```

### Location / Geofencing
- **Hackathon budget:** Use `expo-location` with manual dedup/retry logic
  - Filter events: ignore if app just launched (<5s), require device moved >10m
  - Add foreground service notification on Android
- **If budget allows ($99):** `transistorsoft/react-native-background-geolocation` — only solution with reliable Android doze mode handling

### ElevenLabs TTS
- **Simple narration (no real-time conversation):** REST streaming API → save to temp file → play with `expo-av`. Works without native modules, works in Expo Go.
- **Conversational ghost AI:** Full SDK requires dev build + WebRTC. Commit to dev builds from day 1.
- Cache audio files by location ID — first visit fetches and caches; repeat visits are instant.

### Gemini API
```javascript
// Always do this
const response = await model.generateContent({
  contents: [...],
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: YOUR_SCHEMA, // prevents parse failures
  }
})
// Pin model
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }) // NOT gemini-1.5-flash
```

### Camera / Selfie
- **Expo Go demo:** `expo-image-picker` (works without dev build, stable)
- **Prod / hackathon final build:** `react-native-vision-camera` (frame processors, real-time ML, no Android black screen bug)
- **Sticker background removal:** `atlj/react-native-background-remover` for on-device, or send selfie to Gemini with prompt to describe ghost overlay

### Audio Streaming (Ghost Narration)
```
ElevenLabs REST → fetch full audio → save to FileSystem → expo-av.playAsync()
                                       ↑
                    Do NOT stream directly to expo-av — it fragments
```

### PWA Strategy
- Frame PWA as **"Explore Mode"** (map browsing, viewing memories/stickers, no background features)
- Frame Expo native app as **"Hunt Mode"** (full geofencing, camera challenges, audio narration)
- PWA serves as the shareable/viral link — people view ghost stories without installing the app

### Memory / Sticker Day View
1. `expo-image-picker` → capture selfie or photo
2. Base64 encode at 70% JPEG quality (keeps under 1MB)
3. Gemini 2.0 Flash vision analysis → JSON with caption + ghost context
4. `atlj/react-native-background-remover` → cutout subject
5. React Native Skia → composite sticker (cutout + ghost texture + location text)
6. Store locally with date key for day-by-day gallery

---

## 4. Package Recommendations

### Use These

| Package | Why |
|---------|-----|
| `maplibre-react-native` | Open-source, no Mapbox license, best native map |
| `react-map-gl` + `maplibre-gl-js` | Web/PWA map with same tile source |
| `expo-location` | Foreground location; add dedup for geofencing |
| `react-native-vision-camera` | Required for real-time camera (frame processors) |
| `@shopify/react-native-skia` | GPU-accelerated graphics, Skia Atlas for map markers |
| `expo-blur` | Glassmorphism without GPU stress for simple use |
| `expo-image-picker` | Battle-tested camera/gallery, works in Expo Go |
| `atlj/react-native-background-remover` | On-device MLKit/Vision background removal |
| `expo-router` v3+ | Universal native+web routing, built-in deep linking |
| ElevenLabs REST API | TTS narration without native dependencies |
| `expo-task-manager` | Background task registration (pair with expo-location) |

### Avoid / Use with Caution

| Package | Problem |
|---------|---------|
| `react-native-maps` | No web support, performance collapses at 20+ custom markers |
| `rnmapbox/maps` | Dependency failures, proprietary license |
| `expo-camera` (bare workflow) | Black screen on Android after prebuild — unresolved |
| `expo-av` for real-time streaming | Audio fragmentation — not suitable for streaming TTS |
| `gemini-1.5-flash` via `v1beta` | Removed without redirect — runtime failures |
| Firebase Dynamic Links | Shut down August 2025 |
| `@elevenlabs/react-native` full SDK | Dev build required, Android mic bug unresolved |

---

## 5. Top 10 Day-1 Risks

| # | Risk | Mitigation |
|---|------|-----------|
| 1 | ElevenLabs SDK requires dev build — won't work in Expo Go | Use REST API for TTS; defer full SDK to final build |
| 2 | Android geofencing fires on app open (unfixed expo bug) | Build dedup/debounce from day 1, test on real Android device early |
| 3 | `react-native-maps` custom markers freeze at 20+ items | Decide UI pattern early: simple dot markers OR Skia Atlas |
| 4 | PWA geolocation throttled on iOS Safari | PWA = explore mode only; set user expectations |
| 5 | Gemini model deprecated mid-hackathon | Pin `gemini-2.0-flash`, wrap all API calls in try/catch with fallback |
| 6 | `expo-camera` black screen on Android bare workflow | Use `expo-image-picker` for Expo Go, Vision Camera for dev build |
| 7 | MapLibre requires two separate codepaths (native vs web) | Set up `.tsx` / `.web.tsx` split on day 1 — it's 30 mins but blocks all map work |
| 8 | ElevenLabs/Gemini streaming audio fragmentation | Pre-buffer full audio to temp file before playback — adds 1-3s latency |
| 9 | iOS sticker background removal requires real physical device | Have an iPhone ready for this feature; don't test on simulator |
| 10 | Background GPS drains battery in 30 min | Use `distanceFilter: 10`, `deferredUpdatesInterval`, stop tracking when app backgrounds |

---

## 6. Recommended Tech Stack (Final)

```
Core:           Expo SDK 52+ (managed workflow → dev build as needed)
Routing:        Expo Router v3
State:          Zustand (lightweight, works native+web)

Map (Native):   maplibre-react-native + MapTiler (free tier)
Map (Web):      react-map-gl + maplibre-gl-js + MapTiler

Location:       expo-location + expo-task-manager
                + manual dedup logic for Android geofencing

Camera:         expo-image-picker (Expo Go) → react-native-vision-camera (dev build)
Stickers:       atlj/react-native-background-remover + react-native-skia

AI Narration:   ElevenLabs REST API (streaming TTS, cached by location)
AI Reasoning:   Gemini 2.0 Flash (gemini-2.0-flash, always responseSchema)
Audio Playback: expo-av (play pre-buffered files, not real-time streams)

UI:             expo-blur (glassmorphism) + react-native-skia (custom graphics)
                NativeWind or StyleSheet for layout

Storage:        expo-file-system (audio cache, sticker assets)
                AsyncStorage (user state, visited locations, memory gallery)
                Supabase (optional: sync across devices)

Backend:        Optional FastAPI (if Gemini Live conversational AI needed)
                Otherwise: all client-side with API key in env vars

PWA:            Expo web output + service worker for offline map tile cache
```

---

## 7. Suggested Day Plan

**Hour 1-2:** Project setup
- `npx create-expo-app@latest ghost-hunt --template tabs`
- Install core packages, configure Expo Router
- Set up `.env` with ElevenLabs + Gemini API keys
- Configure `.tsx` / `.web.tsx` map split immediately

**Hour 3-4:** Map + location foundation
- MapLibre native map rendering with ghost-appropriate dark/white style
- expo-location foreground GPS + geofence radius detection (500m trigger)
- Plot test POIs on map with custom ghost markers (simple at first)

**Hour 5-6:** Ghost storytelling core
- Gemini 2.0 Flash: given lat/lng → generate ghost backstory JSON
- ElevenLabs REST TTS: backstory text → audio file → expo-av playback
- Pre-buffer audio before play (avoid fragmentation)

**Hour 7-8:** Camera challenges + sticker generation
- expo-image-picker selfie capture
- Gemini vision: selfie → ghost commentary JSON
- Background removal → basic sticker composite with Skia

**Hour 9-10:** Memory/day view
- Date-keyed local storage of stickers + metadata
- Day-by-day gallery UI (RedNote-style grid)

**Hour 11-12:** UI polish + PWA
- Glassmorphic cards, faded top/bottom blur (`expo-blur`)
- 3D-style ghost map icons (Skia rendered)
- Expo web build → deploy to Vercel as PWA

**Hour 13+:** Bug fixing, demo prep, physical device testing

---

*Sources: expo/expo GitHub issues #25875, #33433, #14076, #21895, #33911, #34376, #31597; elevenlabs/packages #150; react-native-maps #4809; atlj/react-native-background-remover; MapLibre greenash.net.au article; Bitcot Gemini app POC; pathakmukul/Gemini-LIVE-API repo; kiarashplusplus/expo-gemini-live repo*
