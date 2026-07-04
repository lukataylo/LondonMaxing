// ─────────────────────────────────────────────────────────────────────────────
// Old Haunts — live voice conversation with one talking object / ghost.
//
// Reuses the ElevenLabs useVoiceConversation hook, but injects the Grudge system
// prompt: character card + THIS stop's fact pack + running session memory, so the
// character stays in the comedy constraints AND makes audible callbacks (PRD F3,
// F4, F5). On connect it records a one-line grievance to the shared ledger (F6).
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  buildGrudgeDynamicVariables,
  buildGrudgeFirstMessage,
  buildGrudgeSystemPrompt,
  type Character,
  type FactPack,
  type GrudgeCharacter,
  type SessionMemory,
  type Stop,
} from "@grudgemap/shared";
import { useVoiceConversation } from "../voiceConversation";
import "../screens/ConversationBubble.css";
import "./GrudgeConversation.css";

/** British ElevenLabs voices reused from the Old Haunts account. */
const GRUDGE_VOICE: Record<string, string> = {
  "the-bollard": "onwK4e9ZLuTAKqWW03F9", // Daniel — formal, authoritative
  "the-postbox": "JBFqnCBsd6RMkjVDRZzb", // George — grand, warm
  edith: "pFZP5JQG7iQjIQuC4Bku", // Lily — dry, velvety
};

/** Cropped photo-stickers (public/stickers/*.png) keyed by object class. */
const STICKER_BY_CLASS: Record<string, string> = {
  bollard: "bollard",
  postbox: "postbox",
  "ghost-sign": "ghostsign",
  shopfront: "market",
  ghost: "ghostsign",
};
function stickerFor(cls: string): string {
  return `/stickers/${STICKER_BY_CLASS[cls] ?? "phonebox"}.png`;
}

export interface GrudgeConversationProps {
  character: GrudgeCharacter;
  stop: Stop;
  factPack?: FactPack;
  memory: SessionMemory;
  /** Append a one-line grievance to the ledger. */
  onGrudge: (line: string) => void;
  /** Record a one-line summary of this stop for later callbacks. */
  onEvent: (summary: string) => void;
  onClose: () => void;
}

/** Build a minimal Character shim so the voice hook can key on id/name/voice. */
function shim(character: GrudgeCharacter, stop: Stop): Character {
  return {
    id: character.id,
    name: character.name,
    lat: stop.lat,
    lng: stop.lng,
    unlockRadius: stop.unlockRadius,
    category: "history",
    icon: "history",
    era: character.era,
    blurb: character.statusMismatch,
    persona: character.persona,
    challenge: { type: "selfie", instruction: "" },
    voiceHint: character.voiceHint,
  };
}

export function GrudgeConversation({
  character,
  stop,
  factPack,
  memory,
  onGrudge,
  onEvent,
  onClose,
}: GrudgeConversationProps) {
  const transcriptRef = useRef<HTMLDivElement>(null);
  const loggedRef = useRef(false);
  const [agent] = useState(() => shim(character, stop));

  // Snapshot the memory at open time — the system prompt is sent once at session
  // start, so callbacks reflect everything up to this stop (PRD F4).
  const memoryAtOpen = useRef(memory).current;

  const voice = useVoiceConversation({
    voiceIdFor: (c) => GRUDGE_VOICE[c.id] ?? character.voiceId,
    systemPromptFor: () => buildGrudgeSystemPrompt(character, factPack, memoryAtOpen),
    firstMessageFor: () => buildGrudgeFirstMessage(character),
    dynamicVariablesFor: () => buildGrudgeDynamicVariables(character),
  });

  useEffect(() => {
    void voice.start(agent);
    return () => {
      void voice.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On first connect, bank the grievance + the visit for future callbacks.
  useEffect(() => {
    if (voice.status === "connected" && !loggedRef.current) {
      loggedRef.current = true;
      const grievance = factPack?.grievanceHook ?? character.coreGrievance;
      onGrudge(`${character.name}: ${shorten(grievance)}`);
      onEvent(`met ${character.name} at ${stop.name}`);
    }
  }, [voice.status, factPack, character, stop, onGrudge, onEvent]);

  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [voice.transcript]);

  const handleClose = useCallback(async () => {
    await voice.stop();
    onClose();
  }, [voice, onClose]);

  const statusLabel = (() => {
    if (voice.paused) return "Paused";
    switch (voice.status) {
      case "requesting-token":
      case "connecting":
      case "pre-connecting":
        return "Waking it up…";
      case "pre-connected":
        return "Ready";
      case "connected":
        return voice.isSpeaking ? `${character.name} is speaking…` : "Listening — speak now";
      case "disconnected":
        return "Conversation ended";
      case "error":
        return `Error: ${voice.error ?? "unknown"}`;
      default:
        return "Starting…";
    }
  })();

  const ringClass = voice.isSpeaking ? "is-speaking" : voice.status === "connected" ? "is-listening" : "";
  const lastMsg = voice.transcript[voice.transcript.length - 1];

  return createPortal(
    <div className="gm-talk" role="dialog" aria-modal="true" aria-label={`Talking to ${character.name}`}>
      <div className="gm-talk-scrim" aria-hidden="true" />

      <header className="gm-talk-top">
        <span className="gm-talk-place">{stop.name}</span>
        <button className="gm-talk-close" type="button" onClick={() => void handleClose()} aria-label="End conversation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div className="gm-talk-stage">
        <div className={`gm-talk-sticker ${ringClass}`}>
          <span className="gm-talk-halo" aria-hidden="true" />
          <img src={stickerFor(character.objectClass)} alt={character.name} draggable={false} />
        </div>
        <h2 className="gm-talk-name">{character.name}</h2>
        <p className="gm-talk-sub">{character.era} · {character.temperament}</p>
        <p className={`gm-talk-status ${voice.isSpeaking ? "is-speaking" : ""}`}>{statusLabel}</p>
      </div>

      {/* Subtitle-style latest line, not a chat log */}
      <div className="gm-talk-caption" ref={transcriptRef}>
        {lastMsg ? (
          <div className={`gm-talk-line ${lastMsg.source === "user" ? "is-user" : "is-agent"}`}>
            <span className="gm-talk-who">{lastMsg.source === "user" ? "You" : character.name}</span>
            <p>{lastMsg.message}</p>
          </div>
        ) : voice.status === "connected" ? (
          <p className="gm-talk-hint">Say something to {character.name}…</p>
        ) : null}
      </div>

      <div className="gm-talk-controls">
        <button
          className={`gm-talk-btn ${voice.paused ? "is-paused" : ""}`}
          type="button"
          onClick={() => voice.setPaused(!voice.paused)}
          disabled={voice.status !== "connected"}
        >
          {voice.paused ? "Resume" : "Pause"}
        </button>
        <button className="gm-talk-btn gm-talk-btn--end" type="button" onClick={() => void handleClose()}>
          End
        </button>
      </div>
    </div>,
    document.body,
  );
}

function shorten(text: string, max = 90): string {
  const clean = text.replace(/TODO\([^)]*\):\s*/g, "").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}
