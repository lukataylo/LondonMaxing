// In-memory Storage — default, zero-config. Resets on restart.
import type { GhostSpot, Memory, Story } from "@grudgemap/shared";
import { SEED_SPOTS } from "@grudgemap/shared";
import type { Storage } from "./storage.js";

export class MemoryStore implements Storage {
  readonly name = "memory";
  private spots = new Map<string, GhostSpot>();
  private stories = new Map<string, Story>();
  private audio = new Map<string, string>();
  private memories: Memory[] = [];

  async init() {
    for (const s of SEED_SPOTS) this.spots.set(s.id, s);
  }

  async listSpots() {
    return [...this.spots.values()];
  }
  async upsertSpots(spots: GhostSpot[]) {
    for (const s of spots) this.spots.set(s.id, s);
  }

  async getCachedStory(spotId: string) {
    return this.stories.get(spotId);
  }
  async putCachedStory(story: Story) {
    this.stories.set(story.spotId, story);
  }

  async getCachedAudioUrl(key: string) {
    return this.audio.get(key);
  }
  async putCachedAudioUrl(key: string, url: string) {
    this.audio.set(key, url);
  }

  async listMemories() {
    return [...this.memories].sort((a, b) => b.createdAt - a.createdAt);
  }
  async createMemory(m: Memory) {
    this.memories.push(m);
    return m;
  }
}
