# Research: lessons from similar projects + locked tech decisions

> Compiled for the Live London / Build London hackathon. Goal: a consumer "Pokémon Go for ghost stories" app
> that ships **same-day** as a live **PWA** + an **Expo Go** app. TTS = ElevenLabs, reasoning = Gemini.

---

## 1. The one constraint that drives the whole architecture

**Expo Go cannot load custom native modules.** Only modules bundled into the Expo Go binary work.
That disqualifies every good native map/blur/audio lib (`@maplibre/maplibre-react-native`,
`@rnmapbox/maps`, `expo-maps`, custom Skia). It forces a **WebView + hosted-page + server-API**
pattern, which is actually a gift: it lets us build **one** map/UI implementation and reuse it on both
targets with **zero native builds**.

**Winning move:** build the full experience as a web app (the PWA). The Expo Go app is a thin native
shell that embeds the PWA in a `react-native-webview` and only bridges the things browsers do badly:
accurate GPS (`expo-location`), camera (`expo-image-picker`), audio playback (`expo-audio`), native
glass (`expo-blur`). One backend (Railway) holds the API keys and serves both.

---

## 2. Reference repos (closest analogs)

| Repo | Why it matters |
|---|---|
| [Terrastories](https://github.com/Terrastories/terrastories) | Production geo-storytelling: stories pinned to a map (MapLibre GL JS), offline-capable. Best concept reference. |
| [mapbox/storytelling](https://github.com/mapbox/storytelling) | Ties map views to narrative "chapters" — the unlock-by-place UX. |
| [Traviskn/react-native-exponent-pokemon-go](https://github.com/Traviskn/react-native-exponent-pokemon-go) | Pokémon-Go clone in RN+Expo: map+geolocation+camera+gyro. Closest mobile analog. |
| [wellsousaaa/PokemonGO-clone](https://github.com/wellsousaaa/PokemonGO-clone) | Browser/PWA clone using browser GPS — our PWA path. |
| [Thro42/flutter_geogame](https://github.com/Thro42/flutter_geogame) | Scavenger-hunt with location challenges — our challenge mechanic. |
| [kevinlig/go-game-client](https://github.com/kevinlig/go-game-client) · [brnkhy/MapzenGo](https://github.com/brnkhy/MapzenGo) · [MavEtJu/Geocube](https://github.com/MavEtJu/Geocube) | Browser map gameplay / Unity-OSM / geocaching proximity logging. |

---

## 3. Hard-won lessons (geolocation) — these are where similar projects bleed bugs

From Expo issues, transistorsoft notes, and geolocation guides:

- **Never use `getCurrentPosition()` for gameplay.** First fix is often hundreds–thousands of metres off
  (cold GPS). Use `watchPosition` / `watchPositionAsync` and let it warm up.
- **Filter every reading by `coords.accuracy`.** Discard fixes worse than ~30–50 m before acting on them.
- **Smooth jitter** with a 1-D Kalman filter ([kalmanjs](https://github.com/wouterbulten/kalmanjs)) or a
  rolling average of the last N good fixes. Apply a min-movement filter (~5 m) — smaller deltas are noise.
- **Do NOT use native geofencing** (`expo-location startGeofencingAsync`). Expo issues
  [#8351](https://github.com/expo/expo/issues/8351), [#33433](https://github.com/expo/expo/issues/33433),
  [#25875](https://github.com/expo/expo/issues/25875): it ignores your radius (iOS ~75 m, Android ~10 m),
  fires false enter/exit on launch, and behaves differently per-OS. **Roll your own proximity check.**
- **Proximity recipe:** on each *filtered* fix compute `turf.distance` to the target; trigger unlock when
  `distance <= radius` for **2–3 consecutive fixes** (debounce). Use a **generous radius (~30–50 m)** so
  real users actually trigger given GPS error.
- **Hysteresis:** unlock at R, don't re-lock until beyond `R + buffer` (e.g. unlock 40 m / relock 70 m) so
  standing on the boundary doesn't flicker.
- **Battery:** continuous high-accuracy watching is the #1 drain. Stop the watcher when the map isn't
  focused; lower accuracy when far from any target.
- **Permissions:** browser geolocation **requires HTTPS** (Railway gives this); iOS Safari needs a user
  gesture. Always handle the denied state with a fallback UI.
- **🔑 Build a DEBUG TELEPORT mode** — tap the map to set your simulated position. This is the single most
  valuable hackathon item: it lets you **demo on stage and test without walking around**. Gate it behind a
  dev flag / long-press.

Mock-location detection ([react-native-mock-location-detector](https://github.com/adkandari/react-native-mock-location-detector))
exists but is **out of scope** for the hackathon — accept spoofing.

---

## 4. Locked tech decisions

| Concern | Decision | Notes |
|---|---|---|
| Map renderer (both targets) | **`maplibre-gl@^5`** (+ `react-map-gl@^8` via `react-map-gl/maplibre` on web) | One impl, reused in Expo via WebView |
| Map in Expo Go | **`react-native-webview`** → the hosted PWA | Bundled in Expo Go, no native build |
| Tiles / style | **OpenFreeMap "Liberty"** | Light, **3D building extrusions**, **no API key, free, unlimited** — nails the Yandex/Corner look. Fallback: MapTiler "Dataviz Light" |
| TTS | **`@elevenlabs/elevenlabs-js`** on the **backend**, model **`eleven_flash_v2_5`** (~75 ms) | Never ship `xi-api-key` to client. `output_format=mp3_22050_32` for fast first byte |
| Audio playback | PWA: `fetch`→blob→`new Audio()`. Expo: **`expo-audio`** `useAudioPlayer` (NOT `expo-av`, deprecated) | Backend returns a finished MP3 |
| LLM | **`@google/genai`** (NOT deprecated `@google/generative-ai`), model **`gemini-2.5-flash`** | `responseMimeType:"application/json"` + `responseSchema`. `thinkingBudget:0` for speed. Image input via `inlineData` base64 (≤20 MB) |
| Sticker cutout | PWA: **`@imgly/background-removal`** (client-side WASM, free). Expo: server `@imgly/background-removal-node` on Railway | First run downloads model (~tens of MB) |
| Sticker stylize (stretch) | **`gemini-2.5-flash-image`** ("Nano Banana", ~$0.039/img) — "die-cut sticker, thick white border, transparent bg" | Reuses Gemini key |
| Glass UI (PWA) | CSS `backdrop-filter: blur() saturate()` + **`-webkit-` prefix** + `@supports` opaque fallback | |
| Faded top/bottom edges | `mask-image: linear-gradient(...)` on the map, or stacked progressive-blur layers | |
| Glass UI (Expo) | **`expo-blur`** BlurView + **`expo-linear-gradient`** + **`@react-native-masked-view/masked-view`** (all bundled in Expo Go) | Android: `experimentalBlurMethod="dimezisBlurView"` |
| Backend host | **Railway** (HTTPS out of the box) | Holds all keys; serves PWA + API |

### Key docs
- MapLibre GL JS: https://maplibre.org/maplibre-gl-js/docs/ · OpenFreeMap: https://openfreemap.org/
- MapLibre-in-Expo-WebView: https://greenash.net.au/thoughts/2025/01/getting-maplibre-working-for-both-native-and-web-in-expo/
- ElevenLabs stream: https://elevenlabs.io/docs/api-reference/text-to-speech/stream · models: https://elevenlabs.io/docs/overview/models
- Gemini SDK: https://github.com/googleapis/js-genai · structured output: https://ai.google.dev/gemini-api/docs/structured-output · images: https://ai.google.dev/gemini-api/docs/image-understanding
- imgly bg removal: https://github.com/imgly/background-removal-js · expo-audio: https://docs.expo.dev/versions/latest/sdk/audio/ · expo-blur: https://docs.expo.dev/versions/latest/sdk/blur-view/

### Free-tier limits to design around
- **ElevenLabs free:** ~10k credits/mo (~20 min audio), attribution required. → **Cache TTS per story**, keep
  narration short, **pre-generate demo stories**.
- **Gemini free:** ~10 RPM on 2.5-flash (tightened Dec 2025). → cache, use `flash-lite` for short calls,
  pre-generate for demo locations.
