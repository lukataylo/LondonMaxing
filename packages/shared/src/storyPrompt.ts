// ─────────────────────────────────────────────────────────────────────────────
// Story prompt + output schema — owned by Contract (T0), consumed by AI (T3).
// Kept here so the prompt/schema are the same whether mocked or real.
// ─────────────────────────────────────────────────────────────────────────────

import type { StoryRequest } from "./api-contract.js";

export const STORY_SYSTEM_PROMPT = `You are a master of local ghost lore.
Given a real place, invent a short, eerie, PG-13 ghost story that feels specific
to that exact spot — weave in the place name and time of day. Use SECOND PERSON,
present tense, about 140 words. Make it atmospheric, not gory.
Then issue ONE playful real-world challenge the player can do right now:
either a "selfie" (pose with/react to the ghost) or a "walk" (move a short
distance to escape or follow something), with a friendly instruction.`;

/**
 * JSON-shaped response schema. AI track maps this to the @google/genai `Type`
 * enum for responseSchema; the field names/shape must match StoryResponse.
 */
export const STORY_RESPONSE_SCHEMA = {
  type: "object",
  required: ["title", "narration", "challenge"],
  properties: {
    title: { type: "string" },
    narration: { type: "string" },
    challenge: {
      type: "object",
      required: ["type", "instruction"],
      properties: {
        type: { type: "string", enum: ["selfie", "walk"] },
        instruction: { type: "string" },
        targetMeters: { type: "number" },
      },
    },
  },
} as const;

export function buildStoryUserPrompt(req: StoryRequest): string {
  const place = req.placeName ?? `coordinates ${req.lat.toFixed(4)}, ${req.lng.toFixed(4)}`;
  const seed = req.seed ? ` The local legend hints at: ${req.seed}.` : "";
  return `Place: ${place}. Time of day: ${req.timeOfDay}.${seed}
Write the ghost story and challenge now.`;
}
