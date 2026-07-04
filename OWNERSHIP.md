# Ownership map — parallel sub-agent tracks

> This repo is built **contract-first**: every track depends only on the frozen interfaces in
> `packages/shared`, and every capability has a **mock implementation** so all tracks run end-to-end from
> minute one. An agent can own any track below without reading another track's source — only the contract.

## The golden rule
**Touch only your track's directories. Never edit another track's files. If you need a change to a shared
contract (`packages/shared`), that is a coordination event — make the change additive, bump nothing else,
and announce it.** Everything else is yours to build freely.

```
                    ┌────────────────────────────┐
                    │  packages/shared  (CONTRACT) │  ← Track 0, built first, then frozen
                    │  types · api-contract ·      │
                    │  proximity · spots · prompt  │
                    └──────────────┬───────────────┘
        ┌──────────────┬───────────┼───────────┬──────────────┐
        ▼              ▼           ▼            ▼              ▼
  ┌──────────┐  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ apps/web │  │apps/server│ │packages/ │ │packages/ │ │apps/mobile│
  │ FRONTEND │  │ BACKEND   │ │   ai     │ │   db     │ │  MOBILE   │
  │ Track 1  │  │ Track 2   │ │ Track 3  │ │ Track 4  │ │ Track 5   │
  └──────────┘  └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

| Track | Owns (only edits) | Depends on | Can start | Done when |
|---|---|---|---|---|
| **0 · Contract** | `packages/shared/**` | — | now | types + api-contract + proximity exported and building. **Then frozen.** |
| **1 · Frontend** | `apps/web/**` | shared | after T0 | full game loop runs against `VITE_MOCK=true`, then against real server |
| **2 · Backend** | `apps/server/**` | shared, ai, db | after T0 | all `/api/*` routes serve correct shapes; wires ai+db via env providers |
| **3 · AI** | `packages/ai/**` | shared | after T0 | `story`, `tts`, `sticker` providers implement `AiProviders` iface; mock + real |
| **4 · DB** | `packages/db/**` | shared | after T0 | `Storage` iface implemented: memory + postgres; `schema.sql` ready |
| **5 · Mobile** | `apps/mobile/**` | (the deployed web URL) | after T1 demoable | Expo Go shell loads PWA, bridges GPS + camera + audio |

## Why nothing blocks
- **Frontend never waits for Backend** — `apps/web` has `VITE_MOCK=true` and the same mock fixtures the
  server uses, so the whole UI/game loop is buildable with no server running.
- **Backend never waits for AI/DB** — `apps/server` reads `AI_*_PROVIDER` / `DB_PROVIDER` env vars and
  defaults to `mock` / `memory`. It serves correct response shapes before a single real API key exists.
- **AI never waits for Backend** — each provider in `packages/ai` is a pure function behind an interface,
  unit-testable in isolation against a fixture prompt/image.
- **DB never waits for anyone** — `packages/db` is a `Storage` interface with two impls; swap via env.
- **Mobile waits only for a *deployed web URL*** — it's a WebView shell, so it needs the PWA reachable, not
  the PWA's source.

## Integration seam
The single contract is `packages/shared/src/api-contract.ts` (route paths + request/response types) plus
`types.ts` (domain models). Build against those. Mocks live next to each track so they stay in sync:
- `packages/shared/src/spots.ts` — seed ghost spots (shared by web mock + server seed)
- `packages/ai/src/mock.ts` — deterministic story/tts/sticker responses
- `packages/db/src/memory-store.ts` — in-memory `Storage`

## Coordination checklist (only when a contract change is unavoidable)
1. Make it **additive** (new optional field / new endpoint), never a rename or removal mid-build.
2. Update `api-contract.ts` / `types.ts` and the matching **mock** in the same edit.
3. Run `pnpm typecheck` — the type system tells every track what (if anything) broke.

## Bootstrapping (run once, by whoever starts)
```bash
pnpm install
pnpm build:packages      # build shared/ai/db so apps can import them
pnpm dev                 # server + web together; or use dev:server / dev:web / dev:mobile
```
See `PLAN.md` for the timeboxed build order and `ARCHITECTURE.md` for the system design.
