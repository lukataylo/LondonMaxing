# Grudge Map Wiki

**Talk to history where it happened.**

Grudge Map is a location-based PWA and native iOS app. Walk up to a London landmark and the historical figure who lived there steps out to meet you — in their own voice, in their own words, ready for a conversation.

## Quick links

| Page | What's inside |
|------|---------------|
| [Architecture](Architecture) | System diagram, monorepo layout, data model, proximity engine |
| [Core Flows](Core-Flows) | Product state machine, voice conversation flow, challenge + sticker loop |
| [AI and Voices](AI-and-Voices) | Gemini story prompts, ElevenLabs voice pipeline, gpt-4o-mini conversation, sticker generation |
| [Business Model](Business-Model) | Revenue streams, pricing, B2B licensing, partner stops, comparable companies |
| [Roadmap](Roadmap) | Shipped milestones, near-term backlog, stretch goals |

## At a glance

```
Walk to a pin  →  hear their story  →  talk to them  →  earn a sticker  →  fill your scrapbook
```

- **PWA** at [grudgemap.com](https://grudgemap.com) — installable, no App Store required
- **iOS app** via Expo — native GPS, camera, and audio reliability
- **Backend** — Hono API on Railway; all AI keys held server-side
- **Monorepo** — pnpm workspaces: `apps/web`, `apps/mobile`, `apps/server`, `packages/shared`

## Getting started (developer)

```bash
pnpm install
pnpm dev          # builds shared packages, then starts all apps in parallel
```

See the [README](../README.md) for full environment variable setup.

## Who this wiki is for

- **Developers** joining the project — start with [Architecture](Architecture) then [Core Flows](Core-Flows)
- **Investors / judges** evaluating the opportunity — start with [Business Model](Business-Model)
- **AI/voice contributors** — start with [AI and Voices](AI-and-Voices)
- **Product contributors** — start with [Core Flows](Core-Flows) and [Roadmap](Roadmap)
