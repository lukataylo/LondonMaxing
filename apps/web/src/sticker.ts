// ─────────────────────────────────────────────────────────────────────────────
// sticker.ts — turn a captured photo into a die-cut "sticker" PNG.
// Tries the server (/api/sticker, mode:"cutout") first; on ANY failure falls
// back to a client-side canvas sticker. ALWAYS resolves to a usable data URL.
// Self-contained: no imports from api.ts, no external deps.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "";
const STICKER_ROUTE = "/api/sticker";

const SERVER_TIMEOUT_MS = 8_000;
const CANVAS_SIZE = 512;
const BORDER = 14; // die-cut white outline thickness (px)
const CORNER = 64; // rounded-rect corner radius (px)

/**
 * Convert a captured photo into a die-cut sticker PNG (white die-cut border,
 * drop shadow). Never rejects — guaranteed to resolve to a real, non-trivial
 * data URL or the original photo URL as a last resort.
 *
 * Strategy: canvas rendering is the primary path (instant, always produces a
 * real picture of what the user shot). The server is tried in parallel and
 * preferred only when it returns a genuine, non-trivial image (i.e. when a
 * real AI background-removal provider is configured). The mock server returns a
 * 1×1 transparent PNG which is detected and skipped so the sticker is never
 * blank.
 */
export async function makeStickerFromPhoto(
  photoDataUrl: string,
  label?: string,
  fallbackUrl?: string,
): Promise<string> {
  // Run both paths concurrently. Canvas is fast (< 100 ms) and guaranteed;
  // server may be slow or unavailable — we don't block on it.
  const [canvasResult, serverResult] = await Promise.allSettled([
    renderCanvasSticker(photoDataUrl, label),
    requestServerSticker(photoDataUrl),
  ]);

  // Prefer server only when it returns a real (non-trivial) image — i.e. not
  // the 1×1 transparent PNG that the mock provider emits.
  if (
    serverResult.status === "fulfilled" &&
    serverResult.value !== null &&
    !isTrivialSticker(serverResult.value)
  ) {
    return serverResult.value;
  }

  // Canvas is the reliable primary path. renderCanvasSticker rejects if it
  // could not paint a real subject (decode failure / all-black or blank
  // bitmap), so a fulfilled result is always a genuine sticker.
  if (canvasResult.status === "fulfilled") {
    return canvasResult.value;
  }

  // Canvas failed (e.g. the photo could not be decoded). Prefer a generated
  // fallback sticker so the scrapbook NEVER stores a black/blank square; only
  // hand back the raw photo if no fallback was supplied.
  if (fallbackUrl && fallbackUrl.length > 0) {
    return fallbackUrl;
  }
  return photoDataUrl;
}

/**
 * Returns true when a server sticker data URL is too small to contain a real
 * photo (e.g. the 1×1 transparent-PNG mock, ~88 chars of base64 ≈ 66 bytes).
 * A genuine 512×512 sticker PNG will always be many kilobytes.
 */
function isTrivialSticker(dataUrl: string): boolean {
  if (!dataUrl.startsWith("data:image/png;base64,")) return false;
  const b64 = dataUrl.slice("data:image/png;base64,".length);
  // 300 base64 chars ≈ 225 bytes — far below even a minimal real PNG sticker.
  return b64.length < 300;
}

// ── Server path ───────────────────────────────────────────────────────────────

async function requestServerSticker(
  photoDataUrl: string,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVER_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${STICKER_ROUTE}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ imageBase64: photoDataUrl, mode: "cutout" }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stickerUrl?: string } | null;
    const url = data?.stickerUrl;
    return typeof url === "string" && url.length > 0 ? url : null;
  } finally {
    clearTimeout(timer);
  }
}

// ── Client-side fallback ────────────────────────────────────────────────────────

async function renderCanvasSticker(
  photoDataUrl: string,
  label?: string,
): Promise<string> {
  const img = await loadImage(photoDataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");

  // Sticker body sits inside the canvas, leaving room for the outline + shadow.
  const inset = BORDER + 8;
  const bodyX = inset;
  const bodyY = inset;
  const bodySize = CANVAS_SIZE - inset * 2;

  // 1) Soft drop shadow + thick white die-cut border (drawn as a filled rect).
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  roundedRectPath(ctx, bodyX, bodyY, bodySize, bodySize, CORNER);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  // 2) Clip to the inner rounded-rect and cover-fit the photo into it.
  const photoX = bodyX + BORDER;
  const photoY = bodyY + BORDER;
  const photoSize = bodySize - BORDER * 2;
  const photoCorner = Math.max(0, CORNER - BORDER);

  ctx.save();
  roundedRectPath(ctx, photoX, photoY, photoSize, photoSize, photoCorner);
  ctx.clip();
  drawImageCover(ctx, img, photoX, photoY, photoSize, photoSize);
  ctx.restore();

  // Guard: if the photo region came out fully transparent or essentially solid
  // black (the classic mobile-Safari "drawImage before the bitmap is decoded"
  // failure), reject so makeStickerFromPhoto can use the safe fallback rather
  // than store a black square.
  if (!photoRegionHasContent(ctx, photoX, photoY, photoSize, photoSize)) {
    throw new Error("canvas sticker came out blank/black");
  }

  // 3) Optional label on a translucent pill near the bottom (inside the clip).
  if (label && label.trim()) {
    ctx.save();
    roundedRectPath(ctx, photoX, photoY, photoSize, photoSize, photoCorner);
    ctx.clip();
    drawLabelPill(ctx, label.trim(), photoX, photoY, photoSize, photoSize);
    ctx.restore();
  }

  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only opt into CORS for remote URLs. For data:/blob: URLs (the camera
    // capture path) crossOrigin is unnecessary and can interfere with decode.
    if (/^https?:/i.test(src)) img.crossOrigin = "anonymous";
    img.onerror = () => reject(new Error("image load failed"));
    img.onload = () => {
      // Wait for the bitmap to be fully decoded before the caller draws it.
      // onload alone can fire while a large camera JPEG is still decoding on
      // mobile Safari/Chrome, and drawing then paints black pixels.
      const done = () => resolve(img);
      if (typeof img.decode === "function") {
        img.decode().then(done, done);
      } else {
        done();
      }
    };
    img.src = src;
  });
}

/**
 * Samples the rendered photo region. Returns false when every sampled pixel is
 * either transparent or near-black — i.e. nothing real was painted — so the
 * caller can fall back instead of storing a black sticker.
 */
function photoRegionHasContent(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(x, y, w, h).data;
  } catch {
    // Tainted canvas (shouldn't happen for data:/blob: sources). Assume the
    // draw worked rather than discarding a potentially-good sticker.
    return true;
  }
  const STEP = 4 * 97; // sparse stride over RGBA pixels — cheap, representative
  for (let i = 0; i + 3 < data.length; i += STEP) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const alpha = data[i + 3] ?? 0;
    if (alpha < 16) continue; // transparent
    if (r > 24 || g > 24 || b > 24) {
      return true; // a visibly non-black, opaque pixel exists
    }
  }
  return false;
}

/** Cover-fit: scale the image to fill the box, centred, cropping overflow. */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) {
    ctx.drawImage(img, dx, dy, dw, dh);
    return;
  }
  const scale = Math.max(dw / iw, dh / ih);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function drawLabelPill(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const fontSize = Math.round(w * 0.072);
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const text = truncateToWidth(ctx, label, w * 0.82);
  const padX = fontSize * 0.7;
  const padY = fontSize * 0.45;
  const textW = ctx.measureText(text).width;
  const pillW = Math.min(w * 0.9, textW + padX * 2);
  const pillH = fontSize + padY * 2;
  const pillX = x + (w - pillW) / 2;
  const pillY = y + h - pillH - w * 0.05;

  ctx.save();
  roundedRectPath(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, pillX + pillW / 2, pillY + pillH / 2);
  ctx.restore();
}

function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ellipsis = "…";
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ctx.measureText(text.slice(0, mid) + ellipsis).width <= maxWidth) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return text.slice(0, lo).trimEnd() + ellipsis;
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
