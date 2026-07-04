// ─────────────────────────────────────────────────────────────────────────────
// Old Haunts — spoken back-and-forth with a historical character (STRETCH GOAL).
//
// This module starts/stops a real-time *voice* conversation with one of the
// CHARACTERS using ElevenLabs Conversational AI (the "Agents" platform).
// You speak into the mic; the agent answers out loud in the character's voice.
//
// ── How it fits together ──────────────────────────────────────────────────────
//   browser (this file)                server (apps/server)            ElevenLabs
//   ───────────────────                ────────────────────            ──────────
//   1. warmup(character) [on sheet open]
//   2. POST /api/voice-token ─────────▶ holds ELEVENLABS_API_KEY
//                                       GET /v1/convai/conversation/token  ──▶
//                              ◀──────── { conversationToken }             ◀──
//   3. @elevenlabs/client (cached after first load)
//   4. Conversation.startSession({ conversationToken, overrides, … }) — WebRTC
//      → volume=0, sessionMode="warmup"  (agent greets silently)
//   5. [StorySheet shows "Ready — tap to speak"]
//
//   6. start(character) [user taps Talk]
//      → fast path: setVolume(1), sessionMode="live" — INSTANT (<50 ms)
//      → slow path fallback (warmup failed/mismatched): full connect (~0.7-1.5 s)
//
// ── Build-safety guard ────────────────────────────────────────────────────────
// `@elevenlabs/client` is NOT yet a dependency of @grudgemap/web. To keep
// `pnpm --filter @grudgemap/web build` green without it installed, this file:
//   • never *statically* imports the package,
//   • loads it via a dynamic import() through an indirected (non-literal)
//     specifier so `tsc` does not try to resolve it, and
//   • casts the result to the local `ElevenLabsClientModule` interface below
//     (a "clearly-typed thin wrapper" mirroring the real public API).
// When you install the dep and wire this up, no shim needs removing — the same
// code type-checks and runs. See voiceConversation.README.md for the steps.
//
// ── Instant-voice additions (feat/instant-voice) ──────────────────────────────
//   • warmup(character) — call on StorySheet mount to PRE-CONNECT the WebRTC
//     session (muted) so clicking Talk activates in <50 ms instead of ~1-2 s.
//   • New VoiceStatus values: "pre-connecting" | "pre-connected"
//   • sessionModeRef: callbacks shared between warmup and live phases; flipping
//     sessionModeRef.current = "live" re-activates transcript / isSpeaking.
//   • clientModuleRef: @elevenlabs/client cached after first dynamic import.
//   • statusRef: synchronously readable status for stale callbacks.
//
// ── ElevenLabs agent settings for instant feel ───────────────────────────────
//   Dashboard → Agent → Advanced:
//     • TTS model: eleven_flash_v2_5  (~75 ms vs ~250 ms for turbo)
//     • Turn eagerness: eager          (faster endpointing; see conversation-flow docs)
//     • Silence timeout: 1–2 s         (don't wait long after user finishes)
//     • Enable "interruption" in Client Events for barge-in support
//   Dashboard → Agent → Security → Overrides:
//     • Allow: system prompt, first message, language, voice
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import type { Character } from "@grudgemap/shared";

// ── Backend contract (see voiceConversation.README.md for the full sketch) ──────
// POST /api/voice-token  { characterId: string }  →  VoiceTokenResponse
// The server picks ONE auth mode and returns the matching field.
export type VoiceTokenResponse = {
  /** WebRTC (recommended): short-lived conversation token. */
  conversationToken?: string;
  /** WebSocket alternative: a pre-signed wss URL (expires ~15 min). */
  signedUrl?: string;
  /** Public-agent fallback (no auth on the agent) — fine for a demo only. */
  agentId?: string;
};

const VOICE_TOKEN_ROUTE = "/api/voice-token";
const API_BASE = (import.meta.env.VITE_API_BASE as string) || "";

// ── Local typing for @elevenlabs/client (mirrors its public API) ────────────────
// Kept deliberately minimal: only what this module uses.
type ElevenLabsAgentOverrides = {
  agent?: {
    prompt?: { prompt: string };
    firstMessage?: string;
    language?: string;
  };
  tts?: { voiceId?: string };
};

export type ElevenLabsMessage = { message: string; source: "user" | "agent" };

type ElevenLabsSessionConfig = {
  // exactly one of these three identifies the agent / session
  conversationToken?: string;
  signedUrl?: string;
  agentId?: string;
  connectionType?: "webrtc" | "websocket";
  overrides?: ElevenLabsAgentOverrides;
  dynamicVariables?: Record<string, string | number | boolean>;
  onConnect?: (props: { conversationId: string }) => void;
  onDisconnect?: (details?: unknown) => void;
  onMessage?: (props: ElevenLabsMessage) => void;
  onModeChange?: (props: { mode: "speaking" | "listening" }) => void;
  onStatusChange?: (props: { status: string }) => void;
  onError?: (message: string, context?: unknown) => void;
};

type ElevenLabsConversation = {
  endSession: () => Promise<void>;
  setVolume: (opts: { volume: number }) => void;
  getId: () => string;
  /**
   * Mute / unmute the local microphone input. Confirmed present in
   * @elevenlabs/client (BaseConversation.setMicMuted / VoiceConversation):
   *   `setMicMuted(isMuted: boolean): void`
   * Used by pause()/resume() so the visitor's mic stops sending audio to the
   * agent while paused.
   */
  setMicMuted: (isMuted: boolean) => void;
};

type ElevenLabsClientModule = {
  Conversation: {
    startSession: (
      config: ElevenLabsSessionConfig,
    ) => Promise<ElevenLabsConversation>;
  };
};

/**
 * Lifecycle of a voice conversation, surfaced to the UI.
 *
 * Normal (slow) path:  idle → requesting-token → connecting → connected → disconnected
 * Fast (pre-warm) path: idle → pre-connecting → pre-connected → connected → disconnected
 *
 * The "pre-*" states are transparent to the user until they click Talk.
 */
export type VoiceStatus =
  | "idle"
  | "pre-connecting"   // background: fetching token + WebRTC handshake (muted)
  | "pre-connected"    // background: session live + muted; Talk click = instant
  | "requesting-token" // user-triggered slow path: fetching session token
  | "connecting"       // user-triggered slow path: WebRTC handshake
  | "connected"        // live and fully active
  | "disconnected"
  | "error";

export type VoiceConversationState = {
  status: VoiceStatus;
  /** true while the agent (not you) is talking — drive a waveform/avatar with this */
  isSpeaking: boolean;
  /**
   * true while the conversation is paused: agent output is muted
   * (setVolume 0) AND the mic input is muted (setMicMuted true), so neither
   * side can talk. resume() restores both. The session stays connected.
   */
  paused: boolean;
  error: string | null;
  conversationId: string | null;
  transcript: ElevenLabsMessage[];
};

export type VoiceConversationControls = VoiceConversationState & {
  /**
   * Pre-warm the ElevenLabs WebRTC session when the story sheet opens.
   * Fetches a token, loads @elevenlabs/client, and establishes the WebRTC
   * connection (with muted audio) so the next call to `start` is near-instant.
   * Safe to call multiple times — idempotent if already warming/warm.
   */
  warmup: (character: Character) => Promise<void>;
  /** Begin a spoken conversation with `character`. Near-instant if warmup() was called first. */
  start: (character: Character) => Promise<void>;
  /** End the conversation and release the mic. */
  stop: () => Promise<void>;
  /** 0..1 playback volume for the agent's voice. */
  setVolume: (volume: number) => void;
  /**
   * Pause the live conversation: mute the agent's voice (setVolume 0) AND
   * mute the local mic (setMicMuted true) so neither side talks. The WebRTC
   * session stays connected — resume() is instant. No-op unless connected.
   */
  pause: () => void;
  /** Resume from a paused state: restore agent volume to 1 and unmute the mic. */
  resume: () => void;
  /** Convenience setter for pause()/resume(). */
  setPaused: (paused: boolean) => void;
};

const INITIAL_STATE: VoiceConversationState = {
  status: "idle",
  isSpeaking: false,
  paused: false,
  error: null,
  conversationId: null,
  transcript: [],
};

// ── Prompt shaping ──────────────────────────────────────────────────────────────
// Turn a Character's persona + voiceHint into an agent override. NOTE: voiceHint
// is a human-readable voice *description*, not an ElevenLabs voiceId — the actual
// voice is chosen when you create the agent in the dashboard (or via a real
// voiceId in tts.voiceId). We still feed it to the model as guidance.

/** System prompt that keeps the agent in character, historically grounded, and good for *spoken* replies. */
export function buildSystemPrompt(c: Character): string {
  const deathYear = (c.era.match(/(\d{4})\s*$/) ?? [])[1];
  return [
    `You ARE ${c.name} (${c.era}). ${c.blurb}`,
    c.persona,
    "",
    "HISTORICAL GROUNDING — stay accurate to who you really were:",
    `- Speak only from your own real life, work, beliefs and era (${c.era}). Reference real people, places, and events you actually knew.`,
    deathYear
      ? `- You know NOTHING of events after ${deathYear}. If asked about the modern world, react in character with period-appropriate curiosity or bemusement — never explain it as if you lived it.`
      : "",
    "- You are standing with a visitor at your own London blue-plaque address; refer to it and your surroundings naturally.",
    "- Never claim to be an AI, a model, a chatbot, or a program. Never break character.",
    "",
    "SPEAKING STYLE — you are talking ALOUD: reply in 1–3 short, natural sentences, then often ask the visitor a question back so the exchange flows. " +
      `Your manner of speaking: ${c.voiceHint}.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** A short in-character opener the agent says first. */
export function buildFirstMessage(c: Character): string {
  const firstName = c.name.split(" ")[0] ?? c.name;
  return `Ah — a visitor. ${firstName} here. What would you like to ask me?`;
}

function buildOverrides(
  c: Character,
  voiceId?: string,
  custom?: { systemPrompt?: string; firstMessage?: string },
): ElevenLabsAgentOverrides {
  return {
    agent: {
      prompt: { prompt: custom?.systemPrompt ?? buildSystemPrompt(c) },
      firstMessage: custom?.firstMessage ?? buildFirstMessage(c),
      language: "en",
    },
    ...(voiceId ? { tts: { voiceId } } : {}),
  };
}

async function fetchVoiceToken(
  characterId: string,
  signal: AbortSignal,
): Promise<VoiceTokenResponse> {
  const res = await fetch(`${API_BASE}${VOICE_TOKEN_ROUTE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ characterId }),
    signal,
  });
  if (!res.ok) {
    throw new Error(`voice-token request failed (${res.status})`);
  }
  return (await res.json()) as VoiceTokenResponse;
}

/**
 * Load @elevenlabs/client at runtime. The package is a real dependency of
 * @grudgemap/web, so a LITERAL dynamic import lets Vite resolve + code-split it
 * (the old non-literal `@vite-ignore` specifier left it unresolvable at runtime).
 */
async function loadElevenLabsClient(): Promise<ElevenLabsClientModule> {
  return (await import("@elevenlabs/client")) as unknown as ElevenLabsClientModule;
}

/** Build the SessionConfig auth fields from whatever the backend returned. */
function toSessionAuth(
  token: VoiceTokenResponse,
): Pick<ElevenLabsSessionConfig, "conversationToken" | "signedUrl" | "agentId" | "connectionType"> {
  if (token.conversationToken) {
    return { conversationToken: token.conversationToken, connectionType: "webrtc" };
  }
  if (token.signedUrl) {
    return { signedUrl: token.signedUrl, connectionType: "websocket" };
  }
  if (token.agentId) {
    return { agentId: token.agentId, connectionType: "webrtc" };
  }
  throw new Error(
    "voice-token response had no conversationToken, signedUrl, or agentId",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// React hook — the main entry point for the UI.
//
//   const voice = useVoiceConversation();
//   // In a useEffect on mount:
//   useEffect(() => { void voice.warmup(character); }, []);
//   // Talk button:
//   <button onClick={() => voice.status === "connected" ? voice.stop() : voice.start(character)}>
//     {voice.status === "pre-connected" ? "Talk (Ready!)" : "Talk"}
//   </button>
// ─────────────────────────────────────────────────────────────────────────────
export function useVoiceConversation(
  options?: {
    /** real ElevenLabs voiceId override (per-character), if you've cloned voices */
    voiceIdFor?: (c: Character) => string | undefined;
    /**
     * Override the agent system prompt (Old Haunts injects the character card +
     * this stop's fact pack + running session memory here). If omitted the
     * default historically-grounded prompt is used.
     */
    systemPromptFor?: (c: Character) => string;
    /** Override the cached in-character opener the agent says on wake. */
    firstMessageFor?: (c: Character) => string;
    /** Override the ElevenLabs dynamic variables sent with the session. */
    dynamicVariablesFor?: (c: Character) => Record<string, string | number | boolean>;
  },
): VoiceConversationControls {
  const [state, setState] = useState<VoiceConversationState>(INITIAL_STATE);

  // ── Mutable handles that must survive re-renders ────────────────────────────
  // Live session (user-activated)
  const convRef = useRef<ElevenLabsConversation | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Pre-warm session (background, muted until user clicks Talk)
  const warmConvRef = useRef<ElevenLabsConversation | null>(null);
  const warmCharIdRef = useRef<string | null>(null);
  const warmAbortRef = useRef<AbortController | null>(null);
  // Cached @elevenlabs/client module (avoids re-importing after first load)
  const clientModuleRef = useRef<ElevenLabsClientModule | null>(null);
  // "warmup" = callbacks no-op; "live" = callbacks update state
  const sessionModeRef = useRef<"warmup" | "live">("warmup");
  // Synchronously readable status (callbacks hold stale closure over `state`)
  const statusRef = useRef<VoiceStatus>("idle");

  const mountedRef = useRef(true);

  // patch: thin wrapper that keeps statusRef in sync synchronously, which is
  // critical because ElevenLabs callbacks can fire multiple times before React
  // has flushed the next render.
  const patch = useCallback((p: Partial<VoiceConversationState>) => {
    if (p.status !== undefined) statusRef.current = p.status;
    if (mountedRef.current) setState((s) => ({ ...s, ...p }));
  }, []);

  // ── warmup ─────────────────────────────────────────────────────────────────
  // Starts the ElevenLabs WebRTC session in the background (volume = 0) so that
  // clicking Talk is near-instant.  The agent's first-message greeting plays
  // silently; when the user activates the session, callbacks flip to "live" mode
  // and the transcript / isSpeaking state becomes active.
  const warmup = useCallback(
    async (character: Character) => {
      // Idempotent: don't double-warm, and don't clobber a live session.
      if (convRef.current) return;
      if (warmConvRef.current || warmCharIdRef.current === character.id) return;
      const alreadyPrepping =
        statusRef.current === "pre-connecting" ||
        statusRef.current === "pre-connected";
      if (alreadyPrepping) return;
      if (
        statusRef.current !== "idle" &&
        statusRef.current !== "disconnected" &&
        statusRef.current !== "error"
      )
        return;

      patch({ status: "pre-connecting", error: null });
      sessionModeRef.current = "warmup";

      const abort = new AbortController();
      warmAbortRef.current = abort;

      try {
        // Load module + fetch token in parallel — both are needed before WebRTC.
        const [clientModule, token] = await Promise.all([
          clientModuleRef.current
            ? Promise.resolve(clientModuleRef.current)
            : loadElevenLabsClient().then((m) => {
                clientModuleRef.current = m;
                return m;
              }),
          fetchVoiceToken(character.id, abort.signal),
        ]);

        if (abort.signal.aborted || !mountedRef.current) return;

        const auth = toSessionAuth(token);
        const voiceId = options?.voiceIdFor?.(character);

        // Start the WebRTC session with shared callbacks controlled by sessionModeRef.
        const conv = await clientModule.Conversation.startSession({
          ...auth,
          overrides: buildOverrides(character, voiceId, {
            systemPrompt: options?.systemPromptFor?.(character),
            firstMessage: options?.firstMessageFor?.(character),
          }),
          dynamicVariables: options?.dynamicVariablesFor?.(character) ?? {
            character_name: character.name,
            era: character.era,
            voice_hint: character.voiceHint,
          },
          onConnect: ({ conversationId }) => {
            if (abort.signal.aborted || !mountedRef.current) return;
            if (
              statusRef.current === "pre-connecting" ||
              statusRef.current === "connecting"
            ) {
              patch({ status: "pre-connected", conversationId, error: null });
            }
          },
          onDisconnect: () => {
            const wasPre =
              statusRef.current === "pre-connecting" ||
              statusRef.current === "pre-connected";
            warmConvRef.current = null;
            warmCharIdRef.current = null;
            if (wasPre) patch({ status: "idle", isSpeaking: false });
            // If already "connected" (fast-path activated), onDisconnect from the
            // live session fires through convRef's callbacks, not here.
          },
          onModeChange: ({ mode }) => {
            // Only propagate to state when the session has been activated by the user.
            if (sessionModeRef.current === "live") {
              patch({ isSpeaking: mode === "speaking" });
            }
          },
          onMessage: (msg) => {
            if (sessionModeRef.current === "live") {
              setState((s) => ({ ...s, transcript: [...s.transcript, msg] }));
            }
          },
          onError: (message) => {
            warmConvRef.current = null;
            warmCharIdRef.current = null;
            if (
              statusRef.current === "pre-connecting" ||
              statusRef.current === "pre-connected"
            ) {
              // Silently fall back to idle — start() will retry.
              patch({ status: "idle" });
            } else if (sessionModeRef.current === "live") {
              patch({ status: "error", error: message });
            }
          },
        });

        // startSession() resolved — check again in case we were aborted during the
        // WebRTC handshake (which can take several hundred ms).
        if (abort.signal.aborted || !mountedRef.current) {
          await conv.endSession().catch(() => {});
          return;
        }

        // Mute audio so the agent's greeting is inaudible during pre-warm.
        conv.setVolume({ volume: 0 });
        warmConvRef.current = conv;
        warmCharIdRef.current = character.id;
        // Status was already set to "pre-connected" in onConnect above.
      } catch {
        // Warmup failed — silently fall back to idle; start() will do a full connect.
        if (!abort.signal.aborted && mountedRef.current) {
          patch({ status: "idle" });
        }
      }
    },
    [options, patch],
  );

  // ── start ───────────────────────────────────────────────────────────────────
  const start = useCallback(
    async (character: Character) => {
      // Guard against double-starts.
      if (convRef.current) return;

      // ── FAST PATH: use the pre-warmed session ──────────────────────────────
      if (
        warmConvRef.current &&
        warmCharIdRef.current === character.id &&
        statusRef.current === "pre-connected"
      ) {
        const conv = warmConvRef.current;
        warmConvRef.current = null;
        warmCharIdRef.current = null;
        convRef.current = conv;

        // Flip callbacks to live mode and restore audio.
        sessionModeRef.current = "live";
        conv.setVolume({ volume: 1 });

        // The agent's onDisconnect/onError are now handled by the shared callbacks
        // above (which check sessionModeRef.current === "live").
        patch({ status: "connected", error: null, paused: false });
        return;
      }

      // ── SLOW PATH (warmup unavailable / different character / failed) ────────
      // Abort any in-flight warmup so it doesn't clobber our state.
      warmAbortRef.current?.abort();
      warmAbortRef.current = null;
      if (warmConvRef.current) {
        await warmConvRef.current.endSession().catch(() => {});
        warmConvRef.current = null;
        warmCharIdRef.current = null;
      }

      const abort = new AbortController();
      abortRef.current = abort;
      setState({ ...INITIAL_STATE, status: "requesting-token" });
      statusRef.current = "requesting-token";

      try {
        // clientModuleRef may already be populated if warmup ran (even if it failed
        // at the WebRTC stage), so we skip the dynamic import in that case.
        const [clientModule, token] = await Promise.all([
          clientModuleRef.current
            ? Promise.resolve(clientModuleRef.current)
            : loadElevenLabsClient().then((m) => {
                clientModuleRef.current = m;
                return m;
              }),
          fetchVoiceToken(character.id, abort.signal),
        ]);

        if (abort.signal.aborted || !mountedRef.current) return;

        const auth = toSessionAuth(token);
        patch({ status: "connecting" });

        const voiceId = options?.voiceIdFor?.(character);
        sessionModeRef.current = "live";

        const conversation = await clientModule.Conversation.startSession({
          ...auth,
          overrides: buildOverrides(character, voiceId, {
            systemPrompt: options?.systemPromptFor?.(character),
            firstMessage: options?.firstMessageFor?.(character),
          }),
          dynamicVariables: options?.dynamicVariablesFor?.(character) ?? {
            character_name: character.name,
            era: character.era,
            voice_hint: character.voiceHint,
          },
          onConnect: ({ conversationId }) =>
            patch({ status: "connected", conversationId, error: null }),
          onDisconnect: () => {
            convRef.current = null;
            patch({ status: "disconnected", isSpeaking: false });
          },
          onModeChange: ({ mode }) => patch({ isSpeaking: mode === "speaking" }),
          onMessage: (msg) =>
            setState((s) => ({ ...s, transcript: [...s.transcript, msg] })),
          onError: (message) => patch({ status: "error", error: message }),
        });

        convRef.current = conversation;
      } catch (err) {
        convRef.current = null;
        patch({
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [options, patch],
  );

  // ── stop ────────────────────────────────────────────────────────────────────
  const stop = useCallback(async () => {
    // Abort any in-flight warmup.
    warmAbortRef.current?.abort();
    warmAbortRef.current = null;
    const warmConv = warmConvRef.current;
    warmConvRef.current = null;
    warmCharIdRef.current = null;
    if (warmConv) {
      await warmConv.endSession().catch(() => {});
    }

    // End live session.
    abortRef.current?.abort();
    abortRef.current = null;
    const conv = convRef.current;
    convRef.current = null;
    if (conv) {
      try {
        await conv.endSession();
      } catch {
        /* already closed */
      }
    }
    patch({ status: "disconnected", isSpeaking: false, paused: false });
  }, [patch]);

  const setVolume = useCallback((volume: number) => {
    convRef.current?.setVolume({ volume: Math.max(0, Math.min(1, volume)) });
  }, []);

  // ── pause / resume ────────────────────────────────────────────────────────
  // True pause: mute BOTH directions so neither the visitor nor the agent talks
  // while paused. The WebRTC session stays open so resume() is instant.
  //   • agent output  → setVolume({ volume: 0 })
  //   • mic input      → setMicMuted(true)   (real @elevenlabs/client API)
  const pause = useCallback(() => {
    const conv = convRef.current;
    // Only pause an active live session.
    if (!conv || statusRef.current !== "connected") return;
    conv.setVolume({ volume: 0 });
    conv.setMicMuted(true);
    patch({ paused: true });
  }, [patch]);

  const resume = useCallback(() => {
    const conv = convRef.current;
    if (!conv || statusRef.current !== "connected") return;
    conv.setVolume({ volume: 1 });
    conv.setMicMuted(false);
    patch({ paused: false });
  }, [patch]);

  const setPaused = useCallback(
    (next: boolean) => {
      if (next) pause();
      else resume();
    },
    [pause, resume],
  );

  // Tear down ALL sessions if the component unmounts mid-conversation.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      warmAbortRef.current?.abort();
      void warmConvRef.current?.endSession().catch(() => {});
      warmConvRef.current = null;
      abortRef.current?.abort();
      void convRef.current?.endSession().catch(() => {});
      convRef.current = null;
    };
  }, []);

  return { ...state, warmup, start, stop, setVolume, pause, resume, setPaused };
}
