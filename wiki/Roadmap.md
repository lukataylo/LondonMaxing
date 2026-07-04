# Roadmap

## Shipped (as of hackathon build)

- [x] Mapbox map with proximity-unlocked historical figure pins (London seed data)
- [x] Gemini 2.5 Flash story generation with structured output
- [x] ElevenLabs TTS narration in character-matched British voices
- [x] Live ElevenLabs voice conversation (bidirectional, gpt-4o-mini in character)
- [x] Photo challenge + gpt-image-1 sticker generation
- [x] Day-by-day memory scrapbook with sticker collage
- [x] 10 guided walking tours with multi-stop route rendering
- [x] PWA (installable, offline-capable via service worker)
- [x] Expo iOS shell with native GPS, camera, and audio bridges
- [x] Magic-link authentication
- [x] Hono API on Railway (all AI keys server-side)
- [x] Demo unlock / teleport mode for indoor judging
- [x] Service worker network-first strategy (v2) — deploys never serve stale content
- [x] Pinch-zoom routed to Mapbox, not the browser page
- [x] Topbar logo, PWA polish

---

## Near-term backlog (next 4–8 weeks)

### Core product
- [ ] **Android app** — Expo shell for Android (same WebView pattern as iOS)
- [ ] **Offline story cache** — pre-download narration audio for selected tours so the walk works in tunnels
- [ ] **Tour progress persistence** — resume a tour across sessions (currently resets on app close)
- [ ] **Figure discovery feed** — "You've unlocked 4 of 12 Victorians" motivational layer
- [ ] **Social sharing** — share a sticker or day-memory as a native share sheet card

### AI / voice
- [ ] **Voice pack system** — allow users to select from multiple period voices per figure (requires ElevenLabs voice library expansion)
- [ ] **Conversation memory** — give gpt-4o-mini a rolling summary of earlier user messages so the figure "remembers" what was discussed
- [ ] **Multi-language narration** — ElevenLabs dubbing API to offer stories in French, German, Spanish for international visitors

### Business
- [ ] **Subscription paywall** — Stripe integration, Grudge Map Plus gating at 3 free unlocks/day
- [ ] **Partner stop CMS** — lightweight admin interface for adding/editing partner stop listings without a deploy
- [ ] **B2B white-label build** — extract branding tokens so a tourism board can receive a co-branded build
- [ ] **Attribution dashboard** — per-partner dwell-time and tap-through reporting

### Infrastructure
- [ ] **Postgres persistence** — migrate memories from client-side IndexedDB to Railway Postgres for multi-device sync
- [ ] **Story pre-generation script** — `scripts/pregenerate-stories.ts` to warm cache at deploy time for all seed figures
- [ ] **Rate limiting** — per-user API rate limits to prevent abuse of AI endpoints

---

## Medium-term (3–6 months)

- [ ] **Edinburgh launch** — second city seed data (Burns, Scott, Mary Queen of Scots, Hume)
- [ ] **Dublin launch** — Joyce, Wilde, Yeats, Beckett seed data
- [ ] **Museum mode** — partner integration where a museum provides figure data for exhibits; Grudge Map provides the voice conversation layer
- [ ] **Tour creator (B2B)** — drag-and-drop CMS for institutional partners to build their own tours without engineering
- [ ] **Group tour mode** — shared session where multiple users on the same tour see each other's progress
- [ ] **AR preview** — experimental: use device camera to overlay a period illustration of the figure at the pin location

---

## Stretch / aspirational

- [ ] **US launch** — New York (Hamilton, Roosevelt, Whitman), Boston, Philadelphia
- [ ] **Celebrity voice licensing** — partner with estates for celebrity-adjacent voice clones (Bowie, Lennon)
- [ ] **NPC conversations between figures** — Ada Lovelace and Charles Babbage can discuss their collaboration; narrative graph between co-located figures
- [ ] **Classroom mode** — teacher-managed tour with assignment completion tracking; B2B edtech vertical
- [ ] **Live events** — time-limited seasonal tours (Victorian Christmas, Blitz Night Walk)

---

## How to contribute to the roadmap

Open a GitHub issue with the label `roadmap` and describe:
1. Which user need or business outcome it addresses
2. Which wiki section it relates to ([Core Flows](Core-Flows), [AI and Voices](AI-and-Voices), [Business Model](Business-Model))
3. A rough size estimate (S / M / L / XL)

Large items should have an [Architecture](Architecture) design note before implementation begins.
