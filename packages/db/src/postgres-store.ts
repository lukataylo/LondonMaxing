// Postgres Storage (T4 stretch). Implements the same interface as MemoryStore.
// Run schema.sql once (Railway Postgres). `pg` is an optional peer dep.
import { SEED_SPOTS, type GhostSpot, type Memory, type Story } from "@grudgemap/shared";
import type { Storage } from "./storage.js";

export class PostgresStore implements Storage {
  readonly name = "postgres";
  private pool: any;
  private url: string;

  constructor(databaseUrl: string) {
    this.url = databaseUrl;
  }

  async init() {
    const pg = await import("pg");
    this.pool = new pg.Pool({ connectionString: this.url });
    await this.pool.query("SELECT 1");
    const { rows } = await this.pool.query("SELECT COUNT(*) AS count FROM spots");
    if (Number(rows[0]?.count ?? 0) === 0) {
      await this.upsertSpots(SEED_SPOTS);
    }
  }

  async listSpots(): Promise<GhostSpot[]> {
    const { rows } = await this.pool.query("SELECT data FROM spots");
    return rows.map((r: any) => r.data);
  }
  async upsertSpots(spots: GhostSpot[]) {
    for (const s of spots) {
      await this.pool.query(
        "INSERT INTO spots(id, data) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET data=$2",
        [s.id, s]
      );
    }
  }

  async getCachedStory(spotId: string): Promise<Story | undefined> {
    const { rows } = await this.pool.query("SELECT data FROM stories WHERE spot_id=$1", [spotId]);
    return rows[0]?.data;
  }
  async putCachedStory(story: Story) {
    await this.pool.query(
      "INSERT INTO stories(spot_id, data) VALUES($1,$2) ON CONFLICT(spot_id) DO UPDATE SET data=$2",
      [story.spotId, story]
    );
  }

  async getCachedAudioUrl(key: string): Promise<string | undefined> {
    const { rows } = await this.pool.query("SELECT url FROM audio_cache WHERE key=$1", [key]);
    return rows[0]?.url;
  }
  async putCachedAudioUrl(key: string, url: string) {
    await this.pool.query(
      "INSERT INTO audio_cache(key, url) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET url=$2",
      [key, url]
    );
  }

  async listMemories(): Promise<Memory[]> {
    const { rows } = await this.pool.query("SELECT data FROM memories ORDER BY created_at DESC");
    return rows.map((r: any) => r.data);
  }
  async createMemory(m: Memory) {
    await this.pool.query(
      "INSERT INTO memories(id, day, created_at, data) VALUES($1,$2,$3,$4)",
      [m.id, m.day, m.createdAt, m]
    );
    return m;
  }
}
