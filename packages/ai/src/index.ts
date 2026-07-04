export * from "./types.js";
export { MockStoryProvider, MockTtsProvider, MockStickerProvider } from "./mock.js";
export { GeminiStoryProvider, type GeminiOptions } from "./gemini.js";
export { ElevenTtsProvider, type ElevenOptions } from "./eleven.js";
export { ImglyStickerProvider } from "./sticker.js";

import type { AiProviders, StoryProvider, TtsProvider, StickerProvider } from "./types.js";
import { MockStoryProvider, MockTtsProvider, MockStickerProvider } from "./mock.js";
import { GeminiStoryProvider } from "./gemini.js";
import { ElevenTtsProvider } from "./eleven.js";
import { ImglyStickerProvider } from "./sticker.js";

/**
 * Factory the Backend (T2) calls with env config. Defaults to mocks so the
 * server runs end-to-end with no keys. Each capability flips independently.
 */
export function createProviders(env: {
  AI_STORY_PROVIDER?: string;
  AI_TTS_PROVIDER?: string;
  AI_STICKER_PROVIDER?: string;
  GEMINI_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_VOICE_ID?: string;
}): AiProviders {
  const story: StoryProvider =
    env.AI_STORY_PROVIDER === "gemini" && env.GEMINI_API_KEY
      ? new GeminiStoryProvider({ apiKey: env.GEMINI_API_KEY })
      : new MockStoryProvider();

  const tts: TtsProvider =
    env.AI_TTS_PROVIDER === "eleven" && env.ELEVENLABS_API_KEY && env.ELEVENLABS_VOICE_ID
      ? new ElevenTtsProvider({
          apiKey: env.ELEVENLABS_API_KEY,
          defaultVoiceId: env.ELEVENLABS_VOICE_ID,
        })
      : new MockTtsProvider();

  const sticker: StickerProvider =
    env.AI_STICKER_PROVIDER === "imgly"
      ? new ImglyStickerProvider()
      : new MockStickerProvider();

  return { story, tts, sticker };
}
