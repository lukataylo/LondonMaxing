// ─────────────────────────────────────────────────────────────────────────────
// Resilient Old Haunts backend client. Every call degrades gracefully: on any
// non-2xx, error, or timeout it returns null so the UI can fall back to local
// demo content. No external deps.
// ─────────────────────────────────────────────────────────────────────────────

import {
  API_ROUTES,
  type ClassifyResponse,
  type PortalRequest,
  type PortalResponse,
  type StoryRequest,
  type StoryResponse,
  type TtsRequest,
} from "@grudgemap/shared";

/** Base URL for the backend. Empty string = same-origin. */
export const API_BASE = (import.meta.env.VITE_API_BASE as string) || "";

const TIMEOUT_MS = 8000;
/** gpt-image-1 image-to-image can take ~10-25s; give the real render room before
 *  the client falls back to the cached/theatre reveal. */
const PORTAL_TIMEOUT_MS = 30000;

/** POST JSON with an AbortController timeout. Throws on timeout/network error. */
async function postWithTimeout(
  route: string,
  body: unknown,
  headers: Record<string, string> = { "Content-Type": "application/json" },
  timeoutMs: number = TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${API_BASE}${route}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** POST /api/story → generated ghost story, or null on any failure. */
export async function fetchStory(
  req: StoryRequest,
): Promise<StoryResponse | null> {
  try {
    const res = await postWithTimeout(API_ROUTES.story, req);
    if (!res.ok) return null;
    return (await res.json()) as StoryResponse;
  } catch {
    return null;
  }
}

/**
 * POST /api/tts → narration audio (server returns audio/mpeg bytes).
 * Returns an object URL for the audio Blob, or null on any failure.
 */
export async function fetchNarrationUrl(
  req: TtsRequest,
): Promise<string | null> {
  try {
    const res = await postWithTimeout(API_ROUTES.tts, req);
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/**
 * POST /api/portal → Time Portal image-to-image era re-render.
 * Returns the grounded response, or null on any failure (caller shows the
 * theatrical CSS-filter fallback instead).
 */
export async function fetchPortalRender(
  req: PortalRequest,
): Promise<PortalResponse | null> {
  try {
    const res = await postWithTimeout(API_ROUTES.portal, req, undefined, PORTAL_TIMEOUT_MS);
    if (!res.ok) return null;
    return (await res.json()) as PortalResponse;
  } catch {
    return null;
  }
}

/** Vision classify the captured frame → the main talkable subject. Null on failure. */
export async function fetchClassification(imageBase64: string): Promise<ClassifyResponse | null> {
  try {
    const res = await postWithTimeout(API_ROUTES.classify, { imageBase64 }, undefined, 15000);
    if (!res.ok) return null;
    return (await res.json()) as ClassifyResponse;
  } catch {
    return null;
  }
}

/** Turn an image into a die-cut white-outline sticker (gpt-image-2). Null on failure. */
export async function fetchDieCutSticker(imageBase64: string): Promise<string | null> {
  try {
    const res = await postWithTimeout(API_ROUTES.sticker, { imageBase64, mode: "stylize" }, undefined, 90000);
    if (!res.ok) return null;
    const json = (await res.json()) as { stickerUrl?: string };
    return json.stickerUrl ?? null;
  } catch {
    return null;
  }
}

/**
 * POST /api/sticker → server returns JSON { stickerUrl }.
 * Returns the sticker URL, or null on any failure.
 */
export async function fetchSticker(
  imageBase64: string,
  mode?: "cutout" | "stylize",
): Promise<string | null> {
  try {
    const res = await postWithTimeout(API_ROUTES.sticker, { imageBase64, mode });
    if (!res.ok) return null;
    const data = (await res.json()) as { stickerUrl?: string };
    return data.stickerUrl ?? null;
  } catch {
    return null;
  }
}
