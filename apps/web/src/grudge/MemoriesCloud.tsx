// ─────────────────────────────────────────────────────────────────────────────
// MemoriesCloud — the Memories tab. Everything you rewound and talked to,
// filed by day as die-cut stickers floating on a blue Dalston sky. Tap a
// sticker to relive the moment (the full era render + who you met).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { getCharacterForStop, getStop } from "@grudgemap/shared";
import type { Memory } from "@grudgemap/shared";
import { MEMORY_EVENT, formatDay, groupByDay, readMemories } from "./memoryStore";
import "./MemoriesCloud.css";

function titleFor(m: Memory): string {
  return getCharacterForStop(m.spotId)?.name || getStop(m.spotId)?.name || m.caption || "A haunt";
}
function placeFor(m: Memory): string {
  return getStop(m.spotId)?.name || m.caption || "";
}

export function MemoriesCloud({ onClose }: { onClose: () => void }) {
  const [memories, setMemories] = useState<Memory[]>(() => readMemories());
  const [open, setOpen] = useState<Memory | null>(null);

  useEffect(() => {
    const refresh = () => setMemories(readMemories());
    window.addEventListener(MEMORY_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(MEMORY_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const groups = groupByDay(memories);

  return (
    <div className="mc-root" role="dialog" aria-label="Memories">
      <header className="mc-top">
        <div className="mc-title">
          <strong>Memories</strong>
          <span>{memories.length ? `${memories.length} old haunt${memories.length > 1 ? "s" : ""} met` : "your Dalston sticker diary"}</span>
        </div>
        <button className="mc-x" type="button" onClick={onClose} aria-label="Close">✕</button>
      </header>

      {groups.length === 0 ? (
        <div className="mc-empty">
          <div className="mc-empty-emoji">👻🎞️</div>
          <p><strong>Nothing haunts you yet.</strong></p>
          <p>Open the camera, snap something old and rewind it. Every haunt you wake gets pinned here as a sticker.</p>
        </div>
      ) : (
        <div className="mc-days">
          {groups.map((g) => (
            <section className="mc-day" key={g.day}>
              <h2 className="mc-day-label">{formatDay(g.day)}</h2>
              <div className="mc-strip">
                {g.items.map((m) => (
                  <button className="mc-sticker" key={m.id} type="button" onClick={() => setOpen(m)} title={titleFor(m)}>
                    <img src={m.stickerUrl} alt={titleFor(m)} draggable={false} />
                    <span className="mc-sticker-name">{titleFor(m)}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {open ? (
        <div className="mc-lightbox" role="dialog" aria-label={titleFor(open)} onClick={() => setOpen(null)}>
          <div className="mc-lightbox-card" onClick={(e) => e.stopPropagation()}>
            <img className="mc-lightbox-img" src={open.photoUrl || open.stickerUrl} alt={titleFor(open)} />
            <div className="mc-lightbox-meta">
              <strong>{titleFor(open)}</strong>
              <span>{placeFor(open)}{open.caption ? ` · ${open.caption}` : ""}</span>
            </div>
            <button className="mc-lightbox-x" type="button" onClick={() => setOpen(null)}>Close</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
