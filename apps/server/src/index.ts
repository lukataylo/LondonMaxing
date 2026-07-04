// ─────────────────────────────────────────────────────────────────────────────
// Backend (T2). Thin orchestration: wires @grudgemap/ai providers + @grudgemap/db storage
// behind the @grudgemap/shared API contract. Runs fully on mocks with no keys/db.
// ─────────────────────────────────────────────────────────────────────────────
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { createProviders } from "@grudgemap/ai";
import { createStorage } from "@grudgemap/db";
import {
  API_ROUTES,
  buildPortalCaption,
  buildPortalPrompt,
  getCharacterForStop,
  getEra,
  getFactPack,
  getStop,
  type ApiError,
  type ClassifyResponse,
  type CreateMemoryRequest,
  type PortalResponse,
  type StickerRequest,
  type StickerResponse,
  type StoryRequest,
  type StoryResponse,
  type TtsRequest,
  type VoiceTokenResponse,
} from "@grudgemap/shared";

// Local dev convenience: load root .env.local if present (Railway injects real
// env vars in production, where this file won't exist and the call no-ops).
try {
  (process as { loadEnvFile?: (p: string) => void }).loadEnvFile?.("../../.env.local");
} catch {
  /* no .env.local — rely on the platform's injected env */
}

const env = process.env;
const ai = createProviders(env);
const db = createStorage(env);
await db.init();

const app = new Hono();
app.use("*", cors());

app.get(API_ROUTES.health, (c) =>
  c.json({
    ok: true,
    providers: { story: ai.story.name, tts: ai.tts.name, sticker: ai.sticker.name, db: db.name },
  })
);

app.get(API_ROUTES.spots, async (c) => c.json({ spots: await db.listSpots() }));

// POST /api/story — cache by spotId to protect free-tier limits (RESEARCH.md §4)
app.post(API_ROUTES.story, async (c) => {
  try {
    const req = validateStoryRequest(await parseJsonBody(c));
    const cached = await db.getCachedStory(req.spotId);
    if (cached) return c.json(toStoryResponse(cached));
    const story = await ai.story.generate(req);
    await db.putCachedStory({ ...story });
    return c.json(story);
  } catch (err) {
    return routeError(c, err, "story");
  }
});

// POST /api/tts — returns audio/mpeg bytes (client makes a Blob)
app.post(API_ROUTES.tts, async (c) => {
  try {
    const req = validateTtsRequest(await parseJsonBody(c));
    const { audio, contentType } = await ai.tts.synthesize(req);
    return c.body(audio as unknown as ArrayBuffer, 200, { "content-type": contentType });
  } catch (err) {
    return routeError(c, err, "tts");
  }
});

// POST /api/sticker — returns transparent PNG as a data URL
app.post(API_ROUTES.sticker, async (c) => {
  try {
    const req = validateStickerRequest(await parseJsonBody(c));
    // Prefer a real die-cut sticker via gpt-image-2 (thick white outline, like the
    // authored sticker sheets). Falls back to the configured cutout provider.
    const openaiKey = env.PORTAL_OPENAI_API_KEY ?? env.OPENAI_API_KEY;
    if (openaiKey) {
      const stickerUrl = await stickerizeOpenAI(openaiKey, normalizeImageInput(req.imageBase64));
      return c.json<StickerResponse>({ stickerUrl });
    }
    const { png } = await ai.sticker.cutout(req);
    const body: StickerResponse = { stickerUrl: pngDataUrl(png) };
    return c.json(body);
  } catch (err) {
    return routeError(c, err, "sticker");
  }
});

/** gpt-image-2 edit → a die-cut sticker of the subject with a thick white border. */
async function stickerizeOpenAI(apiKey: string, imageBase64: string): Promise<string> {
  const model = env.PORTAL_OPENAI_MODEL ?? "gpt-image-2";
  const bytes = Buffer.from(imageBase64, "base64");
  const form = new FormData();
  form.append("model", model);
  form.append("image", new Blob([bytes], { type: "image/jpeg" }), "frame.jpg");
  form.append(
    "prompt",
    // gpt-image-2 does NOT support a transparent background, so we render the
    // die-cut sticker on a solid chroma-key green field and key it out to
    // transparency on the client. The thick WHITE border is what survives the
    // key, giving the authored sticker-sheet look.
    "Turn the main subject into a single die-cut sticker: bold, clean, illustrated sticker-book style, hugged by a thick smooth WHITE die-cut outline with a subtle drop shadow and glossy finish. Center it on a completely solid flat chroma-key green background (pure #00B140, no gradient, no texture, no other green anywhere in the scene). The only green in the image must be that background.",
  );
  form.append("size", "1024x1024");
  form.append("quality", env.STICKER_OPENAI_QUALITY ?? "low");
  form.append("output_format", "png");
  form.append("n", "1");
  const resp = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(`OpenAI stickerize failed (${resp.status}): ${detail.slice(0, 300)}`);
  }
  const json = (await resp.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
  const first = json.data?.[0];
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  if (first?.url) return first.url;
  throw new Error("OpenAI returned no sticker image");
}

// Memories (optional server persistence; client also stores locally)
app.get(API_ROUTES.memories, async (c) => {
  try {
    return c.json({ memories: await db.listMemories() });
  } catch (err) {
    return routeError(c, err, "memories");
  }
});
app.post(API_ROUTES.memories, async (c) => {
  try {
    const body = validateCreateMemoryRequest(await parseJsonBody(c));
    const memory = await db.createMemory({
      ...body,
      id: `mem_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
      createdAt: Date.now(),
    });
    return c.json({ memory });
  } catch (err) {
    return routeError(c, err, "memories");
  }
});

// POST /api/voice-token — mint a short-lived ElevenLabs ConvAI session token
app.post(API_ROUTES.voiceToken, async (c) => {
  const agentId = env.ELEVENLABS_AGENT_ID;
  if (!agentId) {
    return c.json<ApiError>(
      { error: "ELEVENLABS_AGENT_ID is not configured", detail: "Set ELEVENLABS_AGENT_ID in .env.local or the platform env." },
      503
    );
  }
  const apiKey = env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return c.json<ApiError>({ error: "ELEVENLABS_API_KEY is not configured" }, 503);
  }
  try {
    const url = `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`;
    const resp = await fetch(url, { headers: { "xi-api-key": apiKey } });
    if (!resp.ok) {
      const text = await resp.text();
      return c.json<ApiError>({ error: "ElevenLabs token request failed", detail: text }, 502);
    }
    const data = (await resp.json()) as { token: string };
    return c.json<VoiceTokenResponse>({ conversationToken: data.token });
  } catch (err) {
    return routeError(c, err, "voice-token");
  }
});

// POST /api/portal — Time Portal image-to-image re-render (Nano Banana / Gemini).
// Grounded: era style card + the stop's verified fact pack + composition lock.
app.post(API_ROUTES.portal, async (c) => {
  try {
    const o = objectBody(await parseJsonBody(c));
    const imageBase64 = normalizeImageInput(nonEmptyString(o.imageBase64, "imageBase64"));
    const era = getEra(nonEmptyString(o.era, "era"));
    if (!era) throw new BadRequestError("era must be one of 1890s, 1943, 1974, 2050");
    const stopId = typeof o.stopId === "string" ? o.stopId : undefined;
    const stop = stopId ? getStop(stopId) : undefined;
    const character = stopId ? getCharacterForStop(stopId) : undefined;
    const pack = stopId && character ? getFactPack(character.id, stopId) : undefined;
    const placeName = (typeof o.placeName === "string" && o.placeName) || stop?.name || "this London street";

    const prompt = buildPortalPrompt(era, pack, placeName);
    // No verified facts → refuse to hallucinate (PRD §5).
    if (!prompt) {
      return c.json<ApiError>(
        { error: "No fact pack for this location — the era dial is dark here.", detail: "grounding-required" },
        422,
      );
    }

    // Image provider: prefer OpenAI gpt-image-1 (image-to-image) when a key is
    // present, else Gemini. Gemini free tier has 0 image quota, so OpenAI is the
    // working path for the live render.
    const openaiKey = env.PORTAL_OPENAI_API_KEY ?? env.OPENAI_API_KEY;
    const geminiKey = env.PORTAL_GEMINI_API_KEY ?? env.GEMINI_API_KEY;
    if (!openaiKey && !geminiKey) {
      return c.json<ApiError>({ error: "No image provider key configured" }, 503);
    }

    const rendered = openaiKey
      ? await renderEraOpenAI(openaiKey, imageBase64, prompt)
      : await renderEra(geminiKey as string, imageBase64, prompt);
    const caption = buildPortalCaption(pack);
    const body: PortalResponse = {
      imageUrl: rendered,
      captionLines: caption.lines,
      sources: caption.sources,
    };
    return c.json(body);
  } catch (err) {
    return routeError(c, err, "portal");
  }
});

/** Nano Banana Pro image-to-image via @google/genai. Returns a PNG data URL. */
async function renderEra(apiKey: string, imageBase64: string, prompt: string): Promise<string> {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });
  const model = env.PORTAL_IMAGE_MODEL ?? "gemini-2.5-flash-image";
  const res = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
          { text: prompt },
        ],
      },
    ],
  });
  const parts = res.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const data = (part as { inlineData?: { data?: string; mimeType?: string } }).inlineData;
    if (data?.data) return `data:${data.mimeType ?? "image/png"};base64,${data.data}`;
  }
  throw new Error("Gemini returned no image for the era render");
}

/** OpenAI gpt-image-1 image-to-image (edits) — rewinds the captured street photo
 *  into the target era, grounded by the same prompt. Returns a PNG data URL. */
async function renderEraOpenAI(apiKey: string, imageBase64: string, prompt: string): Promise<string> {
  const model = env.PORTAL_OPENAI_MODEL ?? "gpt-image-2";
  const size = env.PORTAL_OPENAI_SIZE ?? "1024x1024";
  const quality = env.PORTAL_OPENAI_QUALITY ?? "low"; // low = fast + cheap for the live demo
  const bytes = Buffer.from(imageBase64, "base64");

  const form = new FormData();
  form.append("model", model);
  form.append("image", new Blob([bytes], { type: "image/jpeg" }), "frame.jpg");
  form.append("prompt", prompt);
  form.append("size", size);
  form.append("quality", quality);
  form.append("n", "1");

  const resp = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(`OpenAI image edit failed (${resp.status}): ${detail.slice(0, 400)}`);
  }
  const json = (await resp.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
  const first = json.data?.[0];
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  if (first?.url) return first.url;
  throw new Error("OpenAI returned no image for the era render");
}

// POST /api/classify — vision: the 2–4 most prominent talkable subjects in shot.
app.post(API_ROUTES.classify, async (c) => {
  try {
    const o = objectBody(await parseJsonBody(c));
    const base64 = normalizeImageInput(nonEmptyString(o.imageBase64, "imageBase64"));
    const openaiKey = env.PORTAL_OPENAI_API_KEY ?? env.OPENAI_API_KEY;
    if (!openaiKey) return c.json<ApiError>({ error: "OPENAI_API_KEY is not configured" }, 503);
    const subjects = await classifySubjects(openaiKey, `data:image/jpeg;base64,${base64}`);
    return c.json<ClassifyResponse>({ subjects });
  } catch (err) {
    return routeError(c, err, "classify");
  }
});

/** OpenAI vision: the most prominent distinct talkable subjects in a street photo. */
async function classifySubjects(
  apiKey: string,
  imageDataUrl: string,
): Promise<ClassifyResponse["subjects"]> {
  const model = env.CLASSIFY_MODEL ?? "gpt-5.4-mini";
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_completion_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are the eyes of a playful London walking-tour app that lets people 'wake up' and talk to whatever they photograph — buildings, street furniture, roads, trees, statues, anything. Look carefully and honestly at the actual photo. Reply ONLY as JSON.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                'List the 2 to 4 MOST PROMINENT, DISTINCT things in this photo that someone could talk to, most prominent first. Be accurate to what is actually there — if it is a modern office block, say "building", do NOT force it to a bollard. ' +
                'Return JSON: {"subjects":[{"label": short natural phrase e.g. "a 1970s concrete tower block", "objectClass": one of bollard|postbox|phone-box|shopfront|ghost-sign|building|house|church|pub|road|bridge|statue|monument|tree|lamp-post|bench|sign|vehicle|person|other, "emoji": one fitting emoji, "talkable": true}]}. Distinct subjects only — do not repeat the same object.',
            },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(`OpenAI classify failed (${resp.status}): ${detail.slice(0, 300)}`);
  }
  const json = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as { subjects?: Array<Record<string, unknown>> };
  const list = Array.isArray(parsed.subjects) ? parsed.subjects : [];
  const subjects = list
    .map((s) => ({
      label: typeof s.label === "string" ? s.label : "",
      objectClass: typeof s.objectClass === "string" ? s.objectClass : "other",
      emoji: typeof s.emoji === "string" ? s.emoji : undefined,
      talkable: s.talkable !== false,
    }))
    .filter((s) => s.label)
    .slice(0, 4);
  return subjects.length ? subjects : [{ label: "this spot", objectClass: "other", talkable: true }];
}

function normalizeImageInput(input: string): string {
  return input.startsWith("data:") ? input.split(",", 2)[1] ?? "" : input;
}

// Serve the built PWA (single-service deploy): the API is on /api/*, everything
// else is the static Vite build, with an SPA fallback to index.html. Registered
// AFTER the API routes so /api/* always wins. `root` is relative to cwd, which is
// apps/server when started via `pnpm --filter @grudgemap/server start`.
const WEB_DIST_ROOT = env.WEB_DIST_ROOT ?? "../web/dist";
app.use("/*", serveStatic({ root: WEB_DIST_ROOT }));
app.get("/*", serveStatic({ path: `${WEB_DIST_ROOT}/index.html` }));

const port = Number(env.PORT ?? 8787);
serve({ fetch: app.fetch, port });
console.log(`[server] http://localhost:${port}  providers: story=${ai.story.name} tts=${ai.tts.name} sticker=${ai.sticker.name} db=${db.name}`);

function toStoryResponse(s: { spotId: string; title: string; narration: string; challenge: any }): StoryResponse {
  return { spotId: s.spotId, title: s.title, narration: s.narration, challenge: s.challenge };
}

class BadRequestError extends Error {}

async function parseJsonBody(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new BadRequestError("Invalid JSON body");
  }
}

function routeError(c: Context, err: unknown, label: string) {
  if (err instanceof BadRequestError) {
    return c.json<ApiError>({ error: err.message }, 400);
  }
  console.error(`[server] ${label} failed`, err);
  return c.json<ApiError>(
    { error: "Provider or storage failure", detail: err instanceof Error ? err.message : String(err) },
    502
  );
}

function validateStoryRequest(body: unknown): StoryRequest {
  const o = objectBody(body);
  const req: StoryRequest = {
    spotId: nonEmptyString(o.spotId, "spotId"),
    lat: finiteNumber(o.lat, "lat"),
    lng: finiteNumber(o.lng, "lng"),
    timeOfDay: timeOfDay(o.timeOfDay),
  };
  if (o.placeName !== undefined) req.placeName = nonEmptyString(o.placeName, "placeName");
  if (o.seed !== undefined) req.seed = nonEmptyString(o.seed, "seed");
  return req;
}

function validateTtsRequest(body: unknown): TtsRequest {
  const o = objectBody(body);
  const req: TtsRequest = { text: nonEmptyString(o.text, "text") };
  if (o.voiceId !== undefined) req.voiceId = nonEmptyString(o.voiceId, "voiceId");
  if (o.spotId !== undefined) req.spotId = nonEmptyString(o.spotId, "spotId");
  return req;
}

function validateStickerRequest(body: unknown): StickerRequest {
  const o = objectBody(body);
  const imageBase64 = nonEmptyString(o.imageBase64, "imageBase64");
  if (!isPlausibleBase64Image(imageBase64)) {
    throw new BadRequestError("imageBase64 must be base64 image data or a data URL");
  }
  const req: StickerRequest = { imageBase64 };
  if (o.mode !== undefined) {
    if (o.mode !== "cutout" && o.mode !== "stylize") throw new BadRequestError("mode must be cutout or stylize");
    req.mode = o.mode;
  }
  return req;
}

function validateCreateMemoryRequest(body: unknown): CreateMemoryRequest {
  const o = objectBody(body);
  const req: CreateMemoryRequest = {
    day: nonEmptyString(o.day, "day"),
    spotId: nonEmptyString(o.spotId, "spotId"),
    photoUrl: nonEmptyString(o.photoUrl, "photoUrl"),
    stickerUrl: nonEmptyString(o.stickerUrl, "stickerUrl"),
    lat: finiteNumber(o.lat, "lat"),
    lng: finiteNumber(o.lng, "lng"),
  };
  if (o.caption !== undefined) req.caption = nonEmptyString(o.caption, "caption");
  return req;
}

function objectBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new BadRequestError("JSON body must be an object");
  }
  return body as Record<string, unknown>;
}

function nonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestError(`${field} must be a non-empty string`);
  }
  return value;
}

function finiteNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new BadRequestError(`${field} must be a finite number`);
  }
  return value;
}

function timeOfDay(value: unknown): StoryRequest["timeOfDay"] {
  if (value === "morning" || value === "afternoon" || value === "evening" || value === "night") {
    return value;
  }
  throw new BadRequestError("timeOfDay must be morning, afternoon, evening, or night");
}

function isPlausibleBase64Image(input: string): boolean {
  const base64 = input.startsWith("data:") ? input.split(",", 2)[1] ?? "" : input;
  return base64.length > 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(base64) && base64.length % 4 === 0;
}

function pngDataUrl(png: Uint8Array): string {
  return `data:image/png;base64,${Buffer.from(png).toString("base64")}`;
}
