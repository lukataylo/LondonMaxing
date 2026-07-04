-- Postgres schema (T4). Apply once to Railway Postgres before DB_PROVIDER=postgres.
-- JSONB columns keep the shapes aligned with @grudgemap/shared types with zero migrations.

CREATE TABLE IF NOT EXISTS spots (
  id   TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS stories (
  spot_id TEXT PRIMARY KEY,
  data    JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS audio_cache (
  key TEXT PRIMARY KEY,
  url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memories (
  id         TEXT PRIMARY KEY,
  day        TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  data       JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS memories_day_idx ON memories (day);
