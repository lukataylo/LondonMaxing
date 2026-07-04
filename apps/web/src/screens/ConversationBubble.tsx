import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Character } from "@grudgemap/shared";
import { VOICE_BY_GUIDE } from "@grudgemap/shared";
import { useVoiceConversation } from "../voiceConversation";
import "./ConversationBubble.css";

export interface ConversationBubbleProps {
  /** The historical character this conversation is with. */
  character: Character;
  /** Called after stop() resolves — lets App remove the bubble from the tree. */
  onClose: () => void;
}

/**
 * Floating "chat head" bubble that drives a live ElevenLabs voice conversation.
 *
 * Collapsed: a 64 px circular button showing the character's bust, with an
 * animated ring (calm breathe = listening; ripple pulse = speaking) and a
 * colour-coded status dot.  Draggable around the screen.
 *
 * Expanded: a glassmorphic conversation card with the animated avatar, name,
 * era, a live-scrolling transcript, a status line, and an "End conversation"
 * button.  A collapse button returns to the floating bubble without stopping.
 *
 * The hook is owned here — App.tsx only needs to mount/unmount this component.
 */
export function ConversationBubble({ character, onClose }: ConversationBubbleProps) {
  // Open expanded by default when launched from "Talk to …"; the user can
  // minimise to the floating bubble (and re-expand) or end the conversation.
  const [expanded, setExpanded] = useState(true);
  // Distance from the bottom-right corner of the viewport (px).
  const [pos, setPos] = useState({ x: 20, y: 92 });
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Drag state — lives in a ref so pointer handlers never re-close over stale values.
  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  const voice = useVoiceConversation({
    voiceIdFor: (c) => VOICE_BY_GUIDE[c.id],
  });

  // Start the conversation immediately on mount; end it when the bubble unmounts.
  // `voice.start` and `voice.stop` are stable useCallback references from the hook.
  useEffect(() => {
    void voice.start(character);
    return () => {
      void voice.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep transcript scrolled to the latest message.
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [voice.transcript]);

  /** Stop the session and remove the bubble from the tree. */
  const handleClose = useCallback(async () => {
    await voice.stop();
    onClose();
  }, [voice.stop, onClose]);

  // Pause / resume the live conversation (mutes both agent voice + mic).
  // Only meaningful once connected; the hook itself no-ops otherwise.
  const canPause = voice.status === "connected";
  const togglePause = useCallback(() => {
    voice.setPaused(!voice.paused);
  }, [voice.setPaused, voice.paused]);

  // ── Drag + tap logic for the collapsed bubble ──────────────────────────────

  function onBubblePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (expanded) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onBubblePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startClientX;
    const dy = e.clientY - d.startClientY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    // The bubble is anchored to the bottom-right corner, so rightward / downward
    // client movement decreases the right / bottom offset.
    setPos({
      x: Math.max(8, d.origX - dx),
      y: Math.max(8, d.origY - dy),
    });
  }

  function onBubblePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (!d.moved) setExpanded(true); // tap → open card
    dragRef.current = null;
  }

  function onBubblePointerCancel(e: React.PointerEvent<HTMLButtonElement>) {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  }

  // ── Derived display values ────────────────────────────────────────────────

  const firstName = character.name.split(" ")[0] ?? character.name;

  const statusLabel = (() => {
    if (voice.paused) return "Paused";
    switch (voice.status) {
      case "requesting-token":
      case "connecting":
      case "pre-connecting":
        return "Connecting…";
      case "pre-connected":
        return "Ready";
      case "connected":
        return voice.isSpeaking
          ? `${firstName} is speaking…`
          : "Listening — speak now";
      case "disconnected":
        return "Conversation ended";
      case "error":
        return `Error: ${voice.error ?? "unknown"}`;
      default:
        return "Starting…";
    }
  })();

  const dotMod = (() => {
    if (voice.paused) return "paused";
    if (voice.status === "error") return "error";
    if (voice.status === "disconnected") return "idle";
    if (voice.status === "connected" && voice.isSpeaking) return "speaking";
    if (voice.status === "connected") return "listening";
    return "connecting";
  })();

  // While paused, stop the breathing/speaking ring and dim it instead.
  const ringClass = voice.paused
    ? "is-paused"
    : voice.isSpeaking
      ? "is-speaking"
      : voice.status === "connected"
        ? "is-listening"
        : "";

  const avatarSrc = `/pins/${character.id}.png`;

  return createPortal(
    <div
      className="cb-root"
      style={
        {
          "--cb-right": `${pos.x}px`,
          "--cb-bottom": `${pos.y}px`,
        } as React.CSSProperties
      }
    >
      {/* ── Collapsed floating bubble ──────────────────────────────────────── */}
      {!expanded ? (
        <>
          <button
            className={`cb-bubble ${ringClass}`}
            type="button"
            aria-label={`${firstName} — tap to open conversation`}
            onPointerDown={onBubblePointerDown}
            onPointerMove={onBubblePointerMove}
            onPointerUp={onBubblePointerUp}
            onPointerCancel={onBubblePointerCancel}
          >
            <img
              className="cb-bust"
              src={avatarSrc}
              alt={character.name}
              draggable={false}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className={`cb-dot cb-dot--${dotMod}`} aria-hidden="true" />
          </button>
          {/* Small pause/resume toggle overlaid on the bubble (sibling, not
              nested, so it doesn't break the bubble's drag/tap button). */}
          {canPause ? (
            <button
              className={`cb-bubble-pause ${voice.paused ? "is-paused" : ""}`}
              type="button"
              onClick={togglePause}
              aria-label={voice.paused ? "Resume conversation" : "Pause conversation"}
              aria-pressed={voice.paused}
              title={voice.paused ? "Resume" : "Pause"}
            >
              {voice.paused ? (
                /* Play ▶ */
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                /* Pause ⏸ */
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                </svg>
              )}
            </button>
          ) : null}
        </>
      ) : (
        /* ── Expanded conversation card ─────────────────────────────────── */
        <div
          className="cb-card"
          role="dialog"
          aria-modal="true"
          aria-label={`Conversation with ${character.name}`}
        >
          {/* Header: minimise + end controls */}
          <div className="cb-card-header">
            <button
              className="cb-icon-btn"
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Minimise to bubble"
              title="Minimise"
            >
              {/* Minus icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
              </svg>
            </button>
            <button
              className="cb-icon-btn cb-icon-btn--close"
              type="button"
              onClick={() => { void handleClose(); }}
              aria-label="End conversation"
              title="End conversation"
            >
              {/* X icon */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Animated avatar + name + era */}
          <div className="cb-avatar-area">
            <div className={`cb-avatar-wrap ${ringClass}`}>
              <img
                className="cb-avatar"
                src={avatarSrc}
                alt={character.name}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <h2 className="cb-char-name">{character.name}</h2>
            <p className="cb-char-era">{character.era}</p>
          </div>

          {/* Status line */}
          <p className="cb-status">
            <span className={`cb-dot cb-dot--${dotMod}`} aria-hidden="true" />
            {statusLabel}
          </p>

          {/* Live transcript */}
          <div className="cb-transcript" ref={transcriptRef}>
            {voice.transcript.length === 0 && voice.status === "connected" ? (
              <p className="cb-transcript-hint">Say something to {firstName}…</p>
            ) : null}
            {voice.transcript.map((msg, i) => (
              <div
                key={i}
                className={`cb-msg ${msg.source === "user" ? "cb-msg--user" : "cb-msg--agent"}`}
              >
                <span className="cb-msg-who">
                  {msg.source === "user" ? "You" : firstName}
                </span>
                <p className="cb-msg-text">{msg.message}</p>
              </div>
            ))}
          </div>

          {/* Pause/Resume + End conversation CTAs */}
          <div className="cb-actions">
            <button
              className={`cb-pause-btn ${voice.paused ? "is-paused" : ""}`}
              type="button"
              onClick={togglePause}
              disabled={!canPause}
              aria-pressed={voice.paused}
            >
              {voice.paused ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Resume
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                  </svg>
                  Pause
                </>
              )}
            </button>
            <button
              className="cb-end-btn"
              type="button"
              onClick={() => { void handleClose(); }}
            >
              End
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
