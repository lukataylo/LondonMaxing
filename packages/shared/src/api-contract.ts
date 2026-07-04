// ─────────────────────────────────────────────────────────────────────────────
// API contract — the integration seam between Frontend (T1), Backend (T2),
// AI (T3) and DB (T4). Route paths + request/response shapes live here ONLY.
// ─────────────────────────────────────────────────────────────────────────────

import type { Challenge, Memory, Story, TimeOfDay } from "./types.js";

export const API_ROUTES = {
  health: "/api/health",
  spots: "/api/spots",
  story: "/api/story",
  tts: "/api/tts",
  sticker: "/api/sticker",
  memories: "/api/memories",
  voiceToken: "/api/voice-token",
  portal: "/api/portal",
  classify: "/api/classify",
} as const;

// ── POST /api/classify ────────────────────────────────────────────────────────
// Vision classification of a captured frame: what's the main talkable subject?
export type ClassifyRequest = {
  /** captured camera frame, base64 or data URL. */
  imageBase64: string;
};
export type ClassifySubject = {
  /** short human label, e.g. "a cast-iron bollard", "a 1970s tower block" */
  label: string;
  /** normalized class: bollard | postbox | phone-box | shopfront | ghost-sign |
   *  building | house | church | pub | road | bridge | statue | monument | tree |
   *  lamp-post | bench | sign | vehicle | person | other */
  objectClass: string;
  /** rough emoji for a chip, e.g. "🏢" */
  emoji?: string;
  /** is this a thing worth waking up? */
  talkable: boolean;
};
export type ClassifyResponse = {
  /** the 2–4 most prominent distinct subjects in the frame, most prominent first. */
  subjects: ClassifySubject[];
};

// ── POST /api/portal ──────────────────────────────────────────────────────────
// Time Portal: image-to-image re-render of a captured street frame in a chosen
// era, grounded in the location fact pack (Nano Banana / Gemini image).
export type PortalRequest = {
  /** captured camera frame, base64 or data URL. */
  imageBase64: string;
  /** era dial id: "1890s" | "1943" | "1974" | "2050". */
  era: string;
  /** nearest stop id, used to look up the grounding fact pack. */
  stopId?: string;
  /** human-readable place name for the prompt. */
  placeName?: string;
};
export type PortalResponse = {
  /** the re-rendered frame as a data URL. */
  imageUrl: string;
  /** two grounding lines for the caption. */
  captionLines: string[];
  /** source names behind the caption. */
  sources: string[];
};

// ── POST /api/story ─────────────────────────────────────────────────────────
export type StoryRequest = {
  spotId: string;
  lat: number;
  lng: number;
  placeName?: string;
  timeOfDay: TimeOfDay;
  seed?: string;
};
export type StoryResponse = {
  spotId: string;
  title: string;
  narration: string;
  challenge: Challenge;
};

// ── POST /api/tts ─────────────────────────────────────────────────────────────
// Returns audio. Default transport = audio/mpeg bytes; { url } when the server
// caches to storage. Frontend handles both (Blob or url).
export type TtsRequest = {
  text: string;
  voiceId?: string;
  /** echoed back so the client can cache by spot */
  spotId?: string;
};
export type TtsJsonResponse = { url: string };

// ── POST /api/sticker ──────────────────────────────────────────────────────────
export type StickerRequest = {
  /** base64 (no data: prefix) or full data URL; server normalises */
  imageBase64: string;
  /** "cutout" = bg removal + white outline; "stylize" = AI sticker (Nano Banana) */
  mode?: "cutout" | "stylize";
};
export type StickerResponse = {
  /** transparent PNG, data URL or hosted url */
  stickerUrl: string;
};

// ── GET/POST /api/memories ─────────────────────────────────────────────────────
// Optional server-side persistence (DB track). Client also persists locally,
// so these are no-ops in the default client-only mode.
export type MemoriesResponse = { memories: Memory[] };
export type CreateMemoryRequest = Omit<Memory, "id" | "createdAt">;
export type CreateMemoryResponse = { memory: Memory };

// ── POST /api/voice-token ──────────────────────────────────────────────────────
// Mints a short-lived ElevenLabs Conversational-AI session token. The token
// embeds a signed WebSocket URL that the client uses to open a conversation.
export type VoiceTokenRequest = {
  /** Optional: inject a character-specific override (system prompt / voice). */
  guideId?: string;
};
export type VoiceTokenResponse = {
  /** JWT returned by ElevenLabs /v1/convai/conversation/token */
  conversationToken: string;
};

export type ApiError = { error: string; detail?: string };

/** Re-export Story so a client can build the full object from StoryResponse + TTS. */
export type { Story };
