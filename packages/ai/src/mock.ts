// Deterministic mock providers — let every other track run with no API keys.
import type { StickerRequest, StoryRequest, StoryResponse, TtsRequest } from "@grudgemap/shared";
import { getSpot } from "@grudgemap/shared";
import type { StickerProvider, StoryProvider, TtsProvider } from "./types.js";

// A 1x1 transparent PNG (base64) — stand-in sticker so the UI pipeline works.
const TRANSPARENT_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pY8AAAAAElFTkSuQmCC";

function b64ToBytes(b64: string): Uint8Array {
  // Works in Node and browsers.
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(b64, "base64"));
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export class MockStoryProvider implements StoryProvider {
  readonly name = "mock";
  async generate(req: StoryRequest): Promise<StoryResponse> {
    const spot = getSpot(req.spotId);
    const title = spot?.title ?? "An Unnamed Haunting";
    const narration =
      `You pause here as the ${req.timeOfDay} light thins. The air goes cold and ` +
      `you feel watched. ${spot?.seed ? `They say ${spot.seed} lingers in this place — ` : ""}` +
      `a presence that remembers everything this ground has forgotten. A whisper curls ` +
      `past your ear, almost your name. The shadows lean closer, waiting to see what you do next.`;
    const challenge =
      Math.abs(hash(req.spotId)) % 2 === 0
        ? ({ type: "selfie", instruction: "Take a selfie — show the ghost you're not afraid." } as const)
        : ({ type: "walk", instruction: "Walk 80 metres to break the spell.", targetMeters: 80 } as const);
    return { spotId: req.spotId, title, narration, challenge };
  }
}

export class MockTtsProvider implements TtsProvider {
  readonly name = "mock";
  async synthesize(_req: TtsRequest) {
    // Tiny silent MP3 stand-in (not playable audio, but keeps the byte pipeline honest).
    return { audio: new Uint8Array([0xff, 0xfb, 0x90, 0x00]), contentType: "audio/mpeg" };
  }
}

export class MockStickerProvider implements StickerProvider {
  readonly name = "mock";
  async cutout(_req: StickerRequest) {
    return { png: b64ToBytes(TRANSPARENT_PNG_B64) };
  }
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
