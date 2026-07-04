export * from "./storage.js";
export { MemoryStore } from "./memory-store.js";
export { PostgresStore } from "./postgres-store.js";

import type { Storage } from "./storage.js";
import { MemoryStore } from "./memory-store.js";
import { PostgresStore } from "./postgres-store.js";

/** Factory the Backend (T2) calls with env config. Defaults to in-memory. */
export function createStorage(env: {
  DB_PROVIDER?: string;
  DATABASE_URL?: string;
}): Storage {
  if (env.DB_PROVIDER === "postgres" && env.DATABASE_URL) {
    return new PostgresStore(env.DATABASE_URL);
  }
  return new MemoryStore();
}
