// ─────────────────────────────────────────────────────────────────────────────
// AI provider interfaces — the contract the Backend (T2) wires up. Each provider
// is independently implementable & testable. Mock impls let the server run with
// zero API keys; real impls drop in behind the same interface (RESEARCH.md §4).
// ─────────────────────────────────────────────────────────────────────────────

import type {
  StickerRequest,
  StoryRequest,
  StoryResponse,
  TtsRequest,
} from "@grudgemap/shared";

export interface StoryProvider {
  readonly name: string;
  generate(req: StoryRequest): Promise<StoryResponse>;
}

export interface TtsProvider {
  readonly name: string;
  /** Returns MP3 bytes; the server decides whether to stream or cache to a URL. */
  synthesize(req: TtsRequest): Promise<{ audio: Uint8Array; contentType: string }>;
}

export interface StickerProvider {
  readonly name: string;
  /** Returns a transparent PNG as bytes. */
  cutout(req: StickerRequest): Promise<{ png: Uint8Array }>;
}

export interface AiProviders {
  story: StoryProvider;
  tts: TtsProvider;
  sticker: StickerProvider;
}
