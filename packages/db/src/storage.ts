// ─────────────────────────────────────────────────────────────────────────────
// Storage interface (T4). The Backend depends ONLY on this. Default impl is
// in-memory; swap to Postgres via DB_PROVIDER=postgres with zero server changes.
// NB: the app persists memories client-side by default, so server storage is
// optional/multi-device — but the seam is here so the DB track is fully ownable.
// ─────────────────────────────────────────────────────────────────────────────

import type { GhostSpot, Memory, Story } from "@grudgemap/shared";

export interface Storage {
  readonly name: string;
  init(): Promise<void>;

  // Spots
  listSpots(): Promise<GhostSpot[]>;
  upsertSpots(spots: GhostSpot[]): Promise<void>;

  // Story cache (key by spotId) — protects free-tier rate limits (RESEARCH.md §4)
  getCachedStory(spotId: string): Promise<Story | undefined>;
  putCachedStory(story: Story): Promise<void>;

  // TTS cache (key by text hash) -> stored audio location/bytes ref
  getCachedAudioUrl(key: string): Promise<string | undefined>;
  putCachedAudioUrl(key: string, url: string): Promise<void>;

  // Memories (optional server-side persistence)
  listMemories(): Promise<Memory[]>;
  createMemory(m: Memory): Promise<Memory>;
}
