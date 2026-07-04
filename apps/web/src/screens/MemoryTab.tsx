// ─────────────────────────────────────────────────────────────────────────────
// MemoryTab — full-screen keepsake scrapbook.
// Reads from localStorage (grudgemap.memories.v1) so it is self-contained
// and always reflects the latest saved stickers.
// Die-cut stickers sit directly on a blue sky; clicking one opens a lightbox.
// NO lucide-react imports — uses inline SVG / unicode throughout.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import type { Memory } from "@grudgemap/shared";
import { getCharacter } from "@grudgemap/shared";
import "./MemoryTab.css";

// ── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "grudgemap.memories.v1";

function readMemories(): Memory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Memory[]) : [];
  } catch {
    return [];
  }
}

function persistMemories(mems: Memory[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mems));
}

// ── Area lookup (rough London neighbourhood from spot) ────────────────────────

const AREA_BY_SPOT: Record<string, string> = {
  // historical figures
  "ada-lovelace": "St James's",
  "john-logie-baird": "Soho",
  "karl-marx": "Soho",
  "mary-seacole": "Soho",
  "jimi-hendrix": "Mayfair",
  "samuel-johnson": "Fleet St",
  "charles-dickens": "Bloomsbury",
  "virginia-woolf": "Fitzrovia",
  // landmarks
  "big-ben": "Westminster",
  "westminster-abbey": "Westminster",
  "buckingham-palace": "St James's",
  "trafalgar-square": "Charing Cross",
  "tower-bridge": "Tower Hill",
  "tower-of-london": "Tower Hill",
  "st-pauls": "City of London",
  "shakespeares-globe": "Bankside",
};

function areaForSpot(spotId: string): string {
  return AREA_BY_SPOT[spotId] ?? "London";
}

function dayLocation(memories: Memory[]): string {
  for (const m of memories) {
    const area = AREA_BY_SPOT[m.spotId];
    if (area) return area;
  }
  return "London";
}

// ── Formatting ────────────────────────────────────────────────────────────────

function formatDayHeader(day: string, mems: Memory[]): string {
  const date = new Date(`${day}T12:00:00`);
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date);
  const dayNum = date.getDate();
  const month = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(date);
  return `${weekday} ${dayNum} ${month} · ${dayLocation(mems)}`;
}

function formatTimestamp(createdAt: number): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(createdAt));
}

// ── Grouping ─────────────────────────────────────────────────────────────────

type DayGroup = { day: string; mems: Memory[] };

function groupByDay(memories: Memory[]): DayGroup[] {
  const map = new Map<string, Memory[]>();
  for (const m of memories) {
    if (!map.has(m.day)) map.set(m.day, []);
    map.get(m.day)!.push(m);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a)) // newest day first
    .map(([day, mems]) => ({
      day,
      mems: [...mems].sort((a, b) => b.createdAt - a.createdAt),
    }));
}

// ── Dev seed — notable London landmarks using the real die-cut PNGs ──────────

function buildSeedMemories(): Memory[] {
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(now - 86_400_000).toISOString().slice(0, 10);

  const rows: Array<{
    day: string;
    spotId: string;
    file: string;
    caption: string;
    lat: number;
    lng: number;
    offset: number; // hours before now
  }> = [
    { day: today,     spotId: "big-ben",            file: "big-ben",            caption: "Big Ben",             lat: 51.5007, lng: -0.1246, offset: 1 },
    { day: today,     spotId: "westminster-abbey",  file: "westminster-abbey",  caption: "Westminster Abbey",   lat: 51.4994, lng: -0.1273, offset: 2 },
    { day: today,     spotId: "buckingham-palace",  file: "buckingham-palace",  caption: "Buckingham Palace",   lat: 51.5014, lng: -0.1419, offset: 4 },
    { day: today,     spotId: "trafalgar-square",   file: "trafalgar-square",   caption: "Trafalgar Square",    lat: 51.5080, lng: -0.1281, offset: 6 },
    { day: yesterday, spotId: "tower-bridge",       file: "tower-bridge",       caption: "Tower Bridge",        lat: 51.5055, lng: -0.0754, offset: 24 },
    { day: yesterday, spotId: "tower-of-london",    file: "tower-of-london",    caption: "Tower of London",     lat: 51.5081, lng: -0.0759, offset: 26 },
    { day: yesterday, spotId: "st-pauls",           file: "st-pauls",           caption: "St Paul's Cathedral", lat: 51.5138, lng: -0.0984, offset: 28 },
    { day: yesterday, spotId: "shakespeares-globe", file: "shakespeares-globe", caption: "Shakespeare's Globe", lat: 51.5081, lng: -0.0972, offset: 30 },
  ];

  return rows.map(({ day, spotId, file, caption, lat, lng, offset }) => {
    const stickerUrl = `/pins/places/${file}.png`;
    return {
      id: crypto.randomUUID(),
      day,
      spotId,
      photoUrl: stickerUrl,
      stickerUrl,
      caption,
      lat,
      lng,
      createdAt: now - offset * 3_600_000,
    };
  });
}

// ── Icons (inline SVG — no lucide) ───────────────────────────────────────────

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.4 7.4H22l-6.4 4.6 2.4 7.4L12 17l-6 4.4 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
}

// ── Lightbox modal ───────────────────────────────────────────────────────────

function StickerModal({ memory, onClose }: { memory: Memory; onClose: () => void }) {
  const char = getCharacter(memory.spotId);
  const place = areaForSpot(memory.spotId);
  const title = char?.name ?? memory.caption ?? "Memory";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="mt-modal-overlay" onClick={onClose}>
      <div
        className="mt-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="mt-modal-close" type="button" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>

        <div className="mt-modal-sticker">
          <img src={memory.stickerUrl} alt={memory.caption ?? "Sticker"} />
        </div>

        <h2 className="mt-modal-title">{title}</h2>

        {char ? <span className="mt-modal-era">{char.era}</span> : null}

        <p className="mt-modal-place">
          <span aria-hidden="true">📍</span> {place}
        </p>

        {char ? (
          <p className="mt-modal-blurb">{char.blurb}</p>
        ) : memory.caption && memory.caption !== title ? (
          <p className="mt-modal-blurb">{memory.caption}</p>
        ) : null}

        <p className="mt-modal-time">{formatTimestamp(memory.createdAt)}</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MemoryTab({ onClose }: { onClose: () => void }) {
  const [memories, setMemories] = useState<Memory[]>(readMemories);
  const [selected, setSelected] = useState<Memory | null>(null);

  const grouped = groupByDay(memories);
  const total = memories.length;

  function handleSeed() {
    const seeded = buildSeedMemories();
    persistMemories(seeded);
    setMemories(seeded);
  }

  return (
    <div className="memory-tab" role="dialog" aria-label="Your Memories">
      {/* ── Header ── */}
      <header className="mt-header glass-panel">
        <button className="mt-close" type="button" onClick={onClose} aria-label="Close memories">
          <CloseIcon />
        </button>
        <div className="mt-header-text">
          <h1 className="mt-title">Your Memories</h1>
          <p className="mt-subtitle">
            <SparkleIcon />
            {total} sticker{total !== 1 ? "s" : ""}
          </p>
        </div>
      </header>

      {/* ── Scroll area ── */}
      <div className="mt-scroll">
        {grouped.length === 0 ? (
          <div className="mt-empty">
            <div className="mt-empty-icon">
              <CameraIcon />
            </div>
            <h2 className="mt-empty-title">No memories yet</h2>
            <p className="mt-empty-body">
              Explore London, unlock a historical figure, and complete a challenge to earn your first sticker.
            </p>
            <button className="mt-seed-btn" type="button" onClick={handleSeed}>
              Add sample memories
            </button>
          </div>
        ) : (
          <>
            {grouped.map(({ day, mems }) => (
              <section className="mt-day" key={day}>
                <div className="mt-day-head">
                  <span className="mt-day-label">{formatDayHeader(day, mems)}</span>
                  <span className="mt-day-count">
                    {mems.length} sticker{mems.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="mt-row" role="list">
                  {mems.map((m) => (
                    <button
                      key={m.id}
                      className="mt-sticker"
                      type="button"
                      role="listitem"
                      onClick={() => setSelected(m)}
                      aria-label={m.caption ?? "Memory sticker"}
                    >
                      <img src={m.stickerUrl} alt={m.caption ?? "Sticker"} />
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>

      {/* ── Lightbox ── */}
      {selected ? (
        <StickerModal memory={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}
