// ─────────────────────────────────────────────────────────────────────────────
// memoryStore.ts — Old Haunts "Memories": everything you snapped, rewound and
// talked to, filed by day. Backed by localStorage; no server required.
//
// A memory is created the moment the camera reveals a rewound image, so the
// Memories tab fills up as you walk. Each one carries the era render (as a
// die-cut sticker) plus who you met and where.
// ─────────────────────────────────────────────────────────────────────────────

import type { Memory } from "@grudgemap/shared";

const MEMORY_KEY = "oldhaunts.memories.v1";

/** Broadcast so an open Memories tab refreshes the instant a memory is saved. */
export const MEMORY_EVENT = "oldhaunts:memories-changed";

export function readMemories(): Memory[] {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as Memory[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(memories: Memory[]) {
  // Data-URL images are heavy; localStorage caps ~5MB. On quota errors, drop the
  // oldest half and retry so the diary keeps saving the NEWEST memories all
  // evening rather than silently freezing once full.
  let list = memories;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      localStorage.setItem(MEMORY_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent(MEMORY_EVENT));
      return;
    } catch {
      if (list.length <= 1) return; // storage unavailable (private mode) or one giant item
      list = list.slice(0, Math.max(1, Math.ceil(list.length / 2)));
    }
  }
}

function todayKey(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export type NewMemory = {
  spotId: string;
  /** the rewound era render, turned into a sticker */
  stickerUrl: string;
  /** the raw captured "now" frame */
  photoUrl: string;
  caption?: string;
  lat: number;
  lng: number;
};

/** Save a memory (newest first). Returns the full stored memory. */
export function addMemory(input: NewMemory): Memory {
  const memory: Memory = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `mem-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    day: todayKey(),
    spotId: input.spotId,
    photoUrl: input.photoUrl,
    stickerUrl: input.stickerUrl,
    caption: input.caption,
    lat: input.lat,
    lng: input.lng,
    createdAt: Date.now(),
  };
  persist([memory, ...readMemories()]);
  return memory;
}

/** Swap in a better sticker for a memory once it's generated (background upgrade). */
export function updateMemorySticker(id: string, stickerUrl: string) {
  const next = readMemories().map((m) => (m.id === id ? { ...m, stickerUrl } : m));
  persist(next);
}

/** Group memories into day buckets, newest day first, newest item first. */
export function groupByDay(memories: Memory[]): Array<{ day: string; items: Memory[] }> {
  const groups = new Map<string, Memory[]>();
  for (const m of memories) {
    const day = m.day || new Date(m.createdAt).toISOString().slice(0, 10);
    groups.set(day, [...(groups.get(day) ?? []), m]);
  }
  return Array.from(groups.entries())
    .map(([day, items]) => ({ day, items: items.sort((a, b) => b.createdAt - a.createdAt) }))
    .sort((a, b) => b.day.localeCompare(a.day));
}

export function formatDay(day: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { weekday: "short", month: "short", day: "numeric" }).format(
      new Date(`${day}T12:00:00`),
    );
  } catch {
    return day;
  }
}
