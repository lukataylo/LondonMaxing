# Execution plan — one-day build

> Read `ARCHITECTURE.md` and `RESEARCH.md` first. This plan is written so an executing agent (or pair) can
> run it top-to-bottom. **Strategy: build the PWA to demo-quality first; the Expo Go app is a thin WebView
> shell added late.** Protect the demo path above all else.

## The demo (what must work on stage)
1. Open the live PWA → soft-white glassmorphic 3D map with ghost pins + faded edges.
2. **Teleport** onto a pin (or walk to it) → it glows / activates.
3. Tap it → glass story card; **Gemini** ghost story **narrated by ElevenLabs**.
4. Story issues a **selfie** challenge → take photo → it becomes a **sticker**.
5. Open **Memory** → today's stickers in a day-grouped grid.
6. Scan QR → same thing running inside **Expo Go** with native GPS + camera.

Everything else is stretch.

---

## MVP cutline vs stretch

**MVP (must ship):** glass map + pins + faded edges · proximity unlock + teleport debug · Gemini story ·
ElevenLabs narration · selfie → sticker → memory · day-by-day memory grid · deployed PWA · Expo Go shell.

**Stretch (only if green):** walk challenge · AI-stylized stickers (Nano Banana) · push notifications ·
dynamically-generated nearby spots · multi-device sync (Railway Postgres) · offline shell · sharing.

---

## Build order (timeboxed ~8–9 hrs, parallelizable across 2 tracks)

Two tracks can run in parallel after Phase 0. **Track A = Frontend/PWA, Track B = Backend/AI.**

### Phase 0 — Scaffold (45 min, together)
- [ ] pnpm workspace monorepo: `apps/web` (Vite React TS + PWA plugin), `apps/server` (Hono), `apps/mobile`
      (Expo SDK 53+ blank TS), `packages/shared`.
- [ ] `packages/shared`: `types.ts`, `proximity.ts` (stub), `api.ts` (client), `storyPrompt.ts`.
- [ ] Deploy a hello-world `apps/server` to **Railway** immediately (get the HTTPS URL early). Set env
      vars `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`.
- [ ] Seed `spots.json` — 4–6 ghost spots near the venue with real lat/lng.

### Phase 1 — Map + proximity (Track A, 2 hrs)  ← protect this
- [ ] maplibre-gl + react-map-gl with **OpenFreeMap Liberty** style, pitch ~45°.
- [ ] Glass UI tokens (Tailwind): glass card, faded-edge mask, 3D pin markers + float animation.
- [ ] User location dot from `watchPosition`.
- [ ] Implement `proximity.ts` fully (accuracy gate, smoothing, consecutive-fix debounce, hysteresis).
- [ ] **DEBUG TELEPORT**: long-press map → inject synthetic fix. **Do this before anything else visual** —
      it unblocks all testing.
- [ ] Pin activation animation on unlock.

### Phase 2 — AI backend (Track B, 2 hrs)
- [ ] `POST /api/story` → `@google/genai` `gemini-2.5-flash`, structured `responseSchema` (see ARCHITECTURE §6).
- [ ] `POST /api/tts` → `@elevenlabs/elevenlabs-js` `eleven_flash_v2_5`, `mp3_22050_32`, return audio.
- [ ] In-memory cache for story+tts keyed by spotId / text hash.
- [ ] **Pre-generate** stories + audio for the seed spots (script run at deploy) to dodge rate limits.
- [ ] `POST /api/sticker` → `@imgly/background-removal-node` + white die-cut outline → transparent PNG.

### Phase 3 — Storytelling + challenge (Track A, 2 hrs)
- [ ] Tap activated pin → glass story card; fetch `/api/story` then `/api/tts`; play audio on the tap
      (user gesture for iOS). Karaoke/progress nice-to-have.
- [ ] Selfie challenge: open camera (web `getUserMedia` / `<input capture>`), capture → `/api/sticker` →
      save `Memory` to IndexedDB.
- [ ] (Stretch) walk challenge using the proximity fix stream for cumulative distance.

### Phase 4 — Memory view (Track A, 1 hr)
- [ ] Day-grouped grid of sticker cut-outs (the RedNote look): per-day section headers, sticker collage,
      tap for detail. Read from IndexedDB.

### Phase 5 — Expo Go shell (Track B once backend stable, 1.5 hrs)
- [ ] Expo app = `react-native-webview` pointed at the deployed PWA URL.
- [ ] Bridge `expo-location` `watchPositionAsync` fixes → `postMessage` into the WebView (PWA listens and
      feeds them to the same proximity engine, preferring native fixes over browser).
- [ ] Camera via `expo-image-picker`; audio via `expo-audio` if WebView autoplay misbehaves.
- [ ] `expo-blur` + `expo-linear-gradient` for native status/tab-bar glass.
- [ ] Verify in **Expo Go via QR** on a real phone.

### Phase 6 — Polish + deploy + rehearse (1 hr, together)
- [ ] PWA installable (manifest, icons, service worker via `vite-plugin-pwa`).
- [ ] Final deploy; smoke-test the full demo path on the live URL **and** in Expo Go.
- [ ] Pre-load the demo: cached stories/audio warm, demo spots near the stage, teleport ready as backup.
- [ ] Rehearse the 6-step demo twice.

---

## Suggested parallel agent split
- **Agent A (Frontend):** Phases 1, 3, 4, 6-frontend. Owns `apps/web` + `packages/shared` UI bits.
- **Agent B (Backend/AI):** Phases 2, 5, 6-deploy. Owns `apps/server`, Railway, `apps/mobile`.
- **Shared contract:** lock `packages/shared/types.ts` + the `/api/*` shapes in Phase 0 so both tracks
  build against a stable interface and only integrate at Phase 3.

## Definition of done
A live HTTPS PWA URL + an Expo Go QR that both run the 6-step demo end-to-end, with the teleport fallback
wired so the demo never depends on GPS cooperating on stage.
