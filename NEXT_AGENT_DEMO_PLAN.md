# Grudge Map Demo Pickup Plan

## Current State

Local preview is running at:

- Web: `http://localhost:5173/`
- API health: `http://localhost:8787/api/health`

The web demo path was smoke-tested in the in-app browser:

1. Open `http://localhost:5173/`.
2. Click a place pin.
3. Click `Unlock spot`.
4. Story sheet opens.
5. Click `Start challenge`.
6. Selfie challenges show an image file input with `capture="environment"`.
7. `Save sticker` returns to the map and updates today's memory count.

Recent local checks passed:

```bash
pnpm --filter @grudgemap/web build
pnpm --filter @grudgemap/mobile typecheck
```

The web build still has the known Mapbox chunk warning because `mapbox-gl` is imported eagerly.

## What Changed For The New Direction

The visible product direction is now **favorite spots / place memories**, not ghosts.

Changed locally:

- [apps/web/src/App.tsx](./apps/web/src/App.tsx)
  - Pin click now selects a spot instead of silently no-oping on locked spots.
  - Primary CTA now unlocks and opens the selected spot.
  - Story copy is favorite-spot/place-memory oriented.
  - Camera/file input exists for selfie challenges.
  - Saved memory updates the daily memory dock.

- [apps/web/src/styles.css](./apps/web/src/styles.css)
  - Place pins are raised above overlays and styled as soft white floating icon pins.
  - Camera preview styles added.

- [packages/shared/src/spots.ts](./packages/shared/src/spots.ts)
  - Seed locations renamed to neutral favorite spots:
    - `Dock Street Roastery`
    - `Westminster Books`
    - `South Bank Steps`
    - `Soho Listening Bar`

- Mobile copy cleanup started:
  - [apps/mobile/src/GhostMapApp.tsx](./apps/mobile/src/GhostMapApp.tsx)
  - [apps/mobile/src/data/demoStories.ts](./apps/mobile/src/data/demoStories.ts)
  - [apps/mobile/src/components/StoryCard.tsx](./apps/mobile/src/components/StoryCard.tsx)
  - [apps/mobile/src/components/MapLikeRenderer.tsx](./apps/mobile/src/components/MapLikeRenderer.tsx)
  - [apps/mobile/app.json](./apps/mobile/app.json)

## Critical Remaining Work

1. **Make the map feel genuinely navigable**
   - Current fallback map is pretty but not a real pan/zoom map.
   - If a Mapbox token is available, confirm Mapbox layer loads at `localhost:5173`.
   - If Mapbox is not ready, add simple drag-to-pan and wheel/pinch zoom to the fallback map.
   - Keep the white floating tab bar and top/bottom white gradient overlays.

2. **Generate real place-pin assets**
   - User wants Gemini/Nano Banana generated location pins.
   - Create small transparent PNG/WebP assets for categories:
     - coffee/cafe
     - books/history
     - walk/viewpoint
     - music/bar
     - add place/question mark
   - Put assets under `apps/web/public/pins/`.
   - Replace emoji glyphs in `pinGlyph()` with image pins.

3. **Finish removing ghost naming from internals if time allows**
   - Visible UI is mostly clean, but internal type/class names still include `GhostSpot` and `.ghost-pin`.
   - Do not refactor this before the demo unless necessary.
   - Visible copy scan should be enough:

   ```bash
   rg -n "ghost|haunt|spirit|Talk to History" apps/web apps/mobile README.md -S
   ```

4. **Backend worker changes did not land in this worktree**
   - A backend subagent reported hardening `/api/sticker`, validation, Gemini walk defaults, ElevenLabs fallback, and Postgres seeding.
   - Those changes are not present locally in `apps/server/src/index.ts` right now.
   - Reapply or redo them only after the frontend demo is stable.

5. **Camera capture caveat**
   - Web uses `<input type="file" accept="image/*" capture="environment">`.
   - This should open camera on mobile browsers/PWA.
   - Desktop will open a file picker.
   - No real background removal is wired into the current web demo; sticker output is still a local SVG fallback.

6. **Expo Go cleanup**
   - `pnpm --filter @grudgemap/mobile typecheck` passes.
   - Earlier review found Expo dependency skew. Run:

   ```bash
   pnpm --filter @grudgemap/mobile exec expo install --check
   ```

   Then decide whether to run `expo install --fix` before demoing Expo Go.

7. **Railway is paused**
   - Do not continue Railway unless explicitly asked.
   - Deployment notes are in [RAILWAY_HANDOFF.md](./RAILWAY_HANDOFF.md).

## Suggested Next 60-Minute Order

1. Keep `http://localhost:5173/` open and preserve the working demo loop.
2. Add generated/static place-pin image assets and swap them into the map pins.
3. Confirm Mapbox token loads; if not, add minimal fallback map drag/zoom.
4. Run:

   ```bash
   pnpm --filter @grudgemap/web build
   pnpm --filter @grudgemap/mobile typecheck
   ```

5. Do one phone-sized visual pass:
   - pin select
   - unlock spot
   - story
   - camera/file input
   - save sticker
   - memory count increments

## Current Git Notes

Expect local modified files including:

```text
apps/web/src/App.tsx
apps/web/src/styles.css
packages/shared/src/spots.ts
apps/mobile/src/GhostMapApp.tsx
apps/mobile/src/data/demoStories.ts
apps/mobile/src/components/StoryCard.tsx
apps/mobile/src/components/MapLikeRenderer.tsx
apps/mobile/app.json
RAILWAY_HANDOFF.md
```

Do not revert unrelated work. There may also be ignored local files such as `.env.local`, `dist`, and `node_modules`.
