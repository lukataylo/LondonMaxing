# content/ — Grudge Map content pipeline

This directory is the **authoring path** for another agent (or a human) to build
out each character's background, verified fact packs, and prompting.

Start here → **[`AGENT_BRIEF.md`](./AGENT_BRIEF.md)** (the full task brief).

- [`AGENT_BRIEF.md`](./AGENT_BRIEF.md) — what to do, the rules, the checklist.
- [`SCHEMA.md`](./SCHEMA.md) — every field explained.
- [`SOURCES.md`](./SOURCES.md) — Dalston sourcing starter kit.

**The content itself is typed TypeScript** (so malformed content fails the build).
You edit these files:

```
packages/shared/src/grudge/
  types.ts                       # the contract (read-only)
  prompt.ts                      # where the comedy rules are enforced (read-only)
  stops.ts                       # the 6-stop Dalston loop — verify coordinates
  characters/
    the-bollard.ts               # ✅ reference — copy this shape
    edith.ts                     # 🚧 complete the fact packs
    the-postbox.ts               # 🚧 complete the fact packs
```

Validate your work at any time:

```bash
corepack pnpm --filter @grudgemap/shared build
```

The pipeline is the asset (PRD §11): fact packs + character cards generalise to
any street, any era, any city. Keep this structure when adding a new borough pack.
