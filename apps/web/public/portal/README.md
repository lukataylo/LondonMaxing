# Pre-rendered / archival era images

Drop a real "back in the day" image here to light up the photographic rewind for
a haunt. Naming: `<stopId>-<eraId>.jpg` (e.g. `four-aces-1974.jpg`).

The camera flow (TimePortal → cachedRenderFor) tries, in order:
1. live Gemini render (needs a billed PORTAL_GEMINI_API_KEY),
2. a file here matching `<stopId>-<eraId>.jpg`,
3. the CSS "theatre" era-tint over the live photo (always works).

Era ids: 1890s · 1943 · 1974 · 2050. Stop ids are in
packages/shared/src/grudge/stops.ts.
