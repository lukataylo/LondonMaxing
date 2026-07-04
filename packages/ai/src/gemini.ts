// Gemini story provider (T3). Uses @google/genai (NOT the deprecated
// @google/generative-ai). Model gemini-2.5-flash, structured output, thinking off
// for latency. See RESEARCH.md §4 + docs https://github.com/googleapis/js-genai
import type { StoryRequest, StoryResponse } from "@grudgemap/shared";
import { STORY_SYSTEM_PROMPT, buildStoryUserPrompt } from "@grudgemap/shared";
import type { StoryProvider } from "./types.js";

export type GeminiOptions = { apiKey: string; model?: string };

export class GeminiStoryProvider implements StoryProvider {
  readonly name = "gemini";
  private apiKey: string;
  private model: string;

  constructor(opts: GeminiOptions) {
    this.apiKey = opts.apiKey;
    this.model = opts.model ?? "gemini-2.5-flash";
  }

  async generate(req: StoryRequest): Promise<StoryResponse> {
    // Lazy import keeps the dep optional so the package builds without it installed.
    const { GoogleGenAI, Type } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: this.apiKey });

    const res = await ai.models.generateContent({
      model: this.model,
      contents: [
        { role: "user", parts: [{ text: buildStoryUserPrompt(req) }] },
      ],
      config: {
        systemInstruction: STORY_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "narration", "challenge"],
          properties: {
            title: { type: Type.STRING },
            narration: { type: Type.STRING },
            challenge: {
              type: Type.OBJECT,
              required: ["type", "instruction"],
              properties: {
                type: { type: Type.STRING, enum: ["selfie", "walk"] },
                instruction: { type: Type.STRING },
                targetMeters: { type: Type.NUMBER },
              },
            },
          },
        },
      },
    });

    const parsed = JSON.parse(res.text ?? "{}");
    return normalizeStoryResponse(req.spotId, parsed);
  }
}

function normalizeStoryResponse(spotId: string, parsed: unknown): StoryResponse {
  if (!isRecord(parsed)) throw new Error("Gemini returned a non-object story");
  if (typeof parsed.title !== "string" || parsed.title.trim().length === 0) {
    throw new Error("Gemini story is missing title");
  }
  if (typeof parsed.narration !== "string" || parsed.narration.trim().length === 0) {
    throw new Error("Gemini story is missing narration");
  }
  if (!isRecord(parsed.challenge)) throw new Error("Gemini story is missing challenge");
  if (typeof parsed.challenge.instruction !== "string" || parsed.challenge.instruction.trim().length === 0) {
    throw new Error("Gemini challenge is missing instruction");
  }

  if (parsed.challenge.type === "walk") {
    const targetMeters =
      typeof parsed.challenge.targetMeters === "number" && parsed.challenge.targetMeters > 0
        ? parsed.challenge.targetMeters
        : 80;
    return {
      spotId,
      title: parsed.title,
      narration: parsed.narration,
      challenge: {
        type: "walk",
        instruction: parsed.challenge.instruction,
        targetMeters,
      },
    };
  }

  if (parsed.challenge.type === "selfie") {
    return {
      spotId,
      title: parsed.title,
      narration: parsed.narration,
      challenge: {
        type: "selfie",
        instruction: parsed.challenge.instruction,
      },
    };
  }

  throw new Error("Gemini challenge type must be selfie or walk");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
