/**
 * gen-pins.mjs
 *
 * Generates sticker art for Grudge Map using OpenAI gpt-image-1.
 *
 * PART A: 8 character bust stickers → apps/web/public/pins/<id>.png (~320px)
 * PART B: 10 location stickers     → apps/web/public/pins/places/<id>.png (~256px)
 *
 * Pipeline per image (gpt-image-1 primary):
 *   1. POST /v1/images/generations → gpt-image-1 with background:"transparent"
 *   2. Decode data[0].b64_json → PNG buffer (already transparent)
 *   3. White die-cut outline (pngjs separable dilation)
 *   4. Downscale to ~320px / ~256px (sharp)
 *   5. Write PNG
 *
 * Fallback if gpt-image-1 is blocked (org not verified):
 *   1. POST /v1/images/generations → dall-e-3, response_format:"b64_json"
 *   2. Decode → PNG buffer (white background)
 *   3. @imgly/background-removal-node → transparent
 *   4. White die-cut outline + downscale + write
 */

import { PNG } from "pngjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Credentials ───────────────────────────────────────────────────────────────

const envRaw = fs.readFileSync(
  path.join(__dirname, "../.env.local"),
  "utf8"
);
const apiKeyMatch = envRaw.match(/OPENAI_API_KEY=([^\n\r]+)/);
if (!apiKeyMatch) {
  console.error("OPENAI_API_KEY not found in .env.local");
  process.exit(1);
}
const OPENAI_API_KEY = apiKeyMatch[1].trim();

// ── Output dirs ───────────────────────────────────────────────────────────────

const PINS_DIR   = path.join(__dirname, "../apps/web/public/pins");
const PLACES_DIR = path.join(PINS_DIR, "places");
fs.mkdirSync(PINS_DIR,   { recursive: true });
fs.mkdirSync(PLACES_DIR, { recursive: true });

// ── Character data (PART A) ───────────────────────────────────────────────────

const CHARACTERS = [
  {
    id: "ada-lovelace",
    name: "Ada Lovelace",
    props: "holding punch cards and ornate brass clockwork gears",
  },
  {
    id: "john-logie-baird",
    name: "John Logie Baird",
    props: "holding a small early wooden television set with a glowing screen",
  },
  {
    id: "karl-marx",
    name: "Karl Marx",
    props: "holding the Communist Manifesto booklet and a 'Workers Unite' banner scroll",
  },
  {
    id: "mary-seacole",
    name: "Mary Seacole",
    props: "holding a nurse's bag and a medicine bottle",
  },
  {
    id: "jimi-hendrix",
    name: "Jimi Hendrix",
    props: "holding a vibrant electric guitar in psychedelic colours",
  },
  {
    id: "samuel-johnson",
    name: "Samuel Johnson",
    props: "holding a quill pen aloft with a thick leather-bound dictionary under his arm",
  },
  {
    id: "charles-dickens",
    name: "Charles Dickens",
    props: "holding an open book with a quill pen",
  },
  {
    id: "virginia-woolf",
    name: "Virginia Woolf",
    props: "holding a book and fountain pen with an introspective expression",
  },
];

// ── Place / category data (PART B) ────────────────────────────────────────────

const PLACES = [
  { id: "coffee",   desc: "a takeaway coffee cup with steam rising, warm brown tones" },
  { id: "pub",      desc: "a frothy pint of ale in a classic British pub glass, golden amber" },
  { id: "bookshop", desc: "a cosy stack of colourful books with a bookmark ribbon" },
  { id: "museum",   desc: "a neoclassical building with grand stone columns and a triangular pediment" },
  { id: "church",   desc: "a tall Gothic cathedral spire in pale stone against a clear sky" },
  { id: "monument", desc: "a stone plinth with a heroic bronze statue silhouette" },
  { id: "park",     desc: "a single lush green tree with a round canopy on a grassy patch" },
  { id: "theatre",  desc: "two drama masks — comedy and tragedy — in gold against a red curtain" },
  { id: "plaque",   desc: "a round ceramic blue English Heritage plaque with white text on a brick wall" },
  { id: "station",  desc: "a vintage London Underground roundel sign in red and blue" },
];

// ── OpenAI image generation ───────────────────────────────────────────────────

let usingFallback = false; // set to true if gpt-image-1 is blocked

function buildCharacterPrompt(char) {
  return (
    `die-cut sticker, 3D Pixar-style caricature BUST figurine of ${char.name} ` +
    `on a small smooth rounded pedestal, head and shoulders, ` +
    `${char.props}, ` +
    `glossy finish, warm studio lighting from above, vibrant saturated colours, ` +
    `thick white sticker border, transparent background, ` +
    `no text, no labels, no watermark`
  );
}

function buildPlacePrompt(place) {
  return (
    `die-cut sticker, glossy 3D emoji-style icon of ${place.desc}, ` +
    `vibrant saturated colours, thick white sticker border, ` +
    `transparent background, perfectly centered, ` +
    `no text, no labels, no watermark`
  );
}

async function callOpenAI(prompt, model, extraParams = {}) {
  const body = {
    model,
    prompt,
    n: 1,
    ...extraParams,
  };

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    const msg = json?.error?.message ?? res.statusText;
    throw Object.assign(new Error(`OpenAI ${res.status}: ${msg}`), {
      status: res.status,
      errorCode: json?.error?.code,
      errorMessage: msg,
    });
  }

  return json;
}

// Returns: { buffer: Buffer (PNG), model: string }
async function generateImage(prompt) {
  if (!usingFallback) {
    try {
      console.log(`    [gpt-image-1] generating…`);
      const json = await callOpenAI(prompt, "gpt-image-1", {
        size: "1024x1024",
        background: "transparent",
        quality: "medium",
      });
      const b64 = json.data[0].b64_json;
      return { buffer: Buffer.from(b64, "base64"), model: "gpt-image-1" };
    } catch (err) {
      const isBlocked =
        err.status === 403 ||
        (err.errorMessage ?? "").toLowerCase().includes("verified") ||
        (err.errorMessage ?? "").toLowerCase().includes("organization") ||
        err.errorCode === "organization_not_verified";

      if (isBlocked) {
        console.warn(
          `    gpt-image-1 blocked (${err.errorMessage}). ` +
            `Switching to dall-e-3 fallback for all remaining images.`
        );
        usingFallback = true;
        // fall through to dall-e-3 below
      } else {
        throw err; // non-auth error — propagate
      }
    }
  }

  // dall-e-3 fallback
  console.log(`    [dall-e-3 fallback] generating…`);
  const json = await callOpenAI(prompt, "dall-e-3", {
    size: "1024x1024",
    response_format: "b64_json",
    quality: "standard",
  });
  const b64 = json.data[0].b64_json;
  return { buffer: Buffer.from(b64, "base64"), model: "dall-e-3" };
}

// ── Background removal (only for dall-e-3 fallback) ───────────────────────────

let removeBackground = null;
if (true) {
  try {
    const bgRemoval = await import("@imgly/background-removal-node");
    removeBackground = bgRemoval.removeBackground;
    console.log("Background removal: @imgly/background-removal-node loaded OK");
  } catch (e) {
    console.warn(
      `WARNING: @imgly/background-removal-node unavailable (${e.message}). ` +
        `Will use original image when fallback bg-removal is needed.`
    );
  }
}

async function stripBackground(imageBuffer) {
  if (!removeBackground) return imageBuffer;
  try {
    const blob = await removeBackground(imageBuffer, {
      debug: false,
      output: { format: "image/png", quality: 0.95 },
    });
    const ab = await blob.arrayBuffer();
    return Buffer.from(ab);
  } catch (err) {
    console.warn(`  bg-removal error (using original): ${err.message}`);
    return imageBuffer;
  }
}

// ── White die-cut border (separable box dilation) ─────────────────────────────

function addWhiteBorder(inputBuffer, borderPx = 12) {
  const src = PNG.sync.read(inputBuffer);
  const { width, height } = src;
  const srcData = src.data;

  // Horizontal pass
  const horizAlpha = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxA = 0;
      const xMin = Math.max(0, x - borderPx);
      const xMax = Math.min(width - 1, x + borderPx);
      for (let nx = xMin; nx <= xMax; nx++) {
        const a = srcData[(y * width + nx) * 4 + 3];
        if (a > maxA) maxA = a;
      }
      horizAlpha[y * width + x] = maxA;
    }
  }

  // Vertical pass
  const dilatedAlpha = new Uint8Array(width * height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let maxA = 0;
      const yMin = Math.max(0, y - borderPx);
      const yMax = Math.min(height - 1, y + borderPx);
      for (let ny = yMin; ny <= yMax; ny++) {
        const a = horizAlpha[ny * width + x];
        if (a > maxA) maxA = a;
      }
      dilatedAlpha[y * width + x] = maxA;
    }
  }

  // Composite: white border beneath original pixels
  const out = new PNG({ width, height, filterType: 4 });
  out.data = Buffer.alloc(width * height * 4, 0);

  for (let i = 0; i < width * height; i++) {
    if (dilatedAlpha[i] > 32) {
      out.data[i * 4]     = 255;
      out.data[i * 4 + 1] = 255;
      out.data[i * 4 + 2] = 255;
      out.data[i * 4 + 3] = 255;
    }
  }
  for (let i = 0; i < width * height; i++) {
    if (srcData[i * 4 + 3] > 0) {
      out.data[i * 4]     = srcData[i * 4];
      out.data[i * 4 + 1] = srcData[i * 4 + 1];
      out.data[i * 4 + 2] = srcData[i * 4 + 2];
      out.data[i * 4 + 3] = srcData[i * 4 + 3];
    }
  }

  return PNG.sync.write(out);
}

// ── Downscale (sharp) ─────────────────────────────────────────────────────────

let sharp = null;
try {
  sharp = (await import("sharp")).default;
} catch (e) {
  console.warn(`WARNING: sharp unavailable (${e.message}). Skipping downscale.`);
}

async function downscale(buffer, targetPx) {
  if (!sharp) return buffer;
  try {
    return await sharp(buffer)
      .resize(targetPx, targetPx, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
  } catch (err) {
    console.warn(`  downscale error (using original): ${err.message}`);
    return buffer;
  }
}

// ── Core pipeline ─────────────────────────────────────────────────────────────

async function processImage(prompt, outPath, targetPx, borderPx) {
  // 1. Generate
  let generated;
  generated = await generateImage(prompt);
  console.log(
    `  generated: ${(generated.buffer.length / 1024).toFixed(1)} KB (model: ${generated.model})`
  );

  // 2. Background removal (only needed for dall-e-3 fallback)
  let transparent = generated.buffer;
  if (generated.model !== "gpt-image-1") {
    console.log("  removing background…");
    transparent = await stripBackground(generated.buffer);
    console.log(`  transparent: ${(transparent.length / 1024).toFixed(1)} KB`);
  }

  // 3. White die-cut border
  console.log(`  adding white die-cut border (${borderPx}px)…`);
  let bordered;
  try {
    bordered = addWhiteBorder(transparent, borderPx);
  } catch (err) {
    console.warn(`  border failed (using transparent): ${err.message}`);
    bordered = transparent;
  }

  // 4. Downscale
  console.log(`  downscaling to ~${targetPx}px…`);
  const final = await downscale(bordered, targetPx);

  // 5. Save
  fs.writeFileSync(outPath, final);
  const { size } = fs.statSync(outPath);
  console.log(`  saved: ${outPath} (${(size / 1024).toFixed(1)} KB)`);

  return { success: true, sizeKB: (size / 1024).toFixed(1), model: generated.model };
}

// ── PART A — Character busts ──────────────────────────────────────────────────

async function generateCharacterPin(char) {
  console.log(`\n[CHAR] ${char.name}  (${char.id})`);
  const prompt  = buildCharacterPrompt(char);
  const outPath = path.join(PINS_DIR, `${char.id}.png`);

  try {
    return await processImage(prompt, outPath, 320, 12);
  } catch (err) {
    console.error(`  FAIL: ${err.message}`);
    return { success: false, reason: err.message };
  }
}

// ── PART B — Location stickers ────────────────────────────────────────────────

async function generatePlacePin(place) {
  console.log(`\n[PLACE] ${place.id}`);
  const prompt  = buildPlacePrompt(place);
  const outPath = path.join(PLACES_DIR, `${place.id}.png`);

  try {
    return await processImage(prompt, outPath, 256, 8);
  } catch (err) {
    console.error(`  FAIL: ${err.message}`);
    return { success: false, reason: err.message };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Grudge Map Sticker Generator — OpenAI gpt-image-1");
  console.log("=================================================");
  console.log(`Pins dir:   ${PINS_DIR}`);
  console.log(`Places dir: ${PLACES_DIR}\n`);

  const charResults   = [];
  const placeResults  = [];

  // ── PART A ────────────────────────────────────────────────────────────────
  console.log("\n══ PART A: 8 Character Bust Stickers ══\n");

  for (let i = 0; i < CHARACTERS.length; i++) {
    const char   = CHARACTERS[i];
    const result = await generateCharacterPin(char);
    charResults.push({ ...char, ...result });

    if (i < CHARACTERS.length - 1) {
      console.log("  (waiting 4s…)");
      await new Promise((r) => setTimeout(r, 4000));
    }
  }

  // ── PART B ────────────────────────────────────────────────────────────────
  console.log("\n\n══ PART B: 10 Location Stickers ══\n");

  for (let i = 0; i < PLACES.length; i++) {
    const place  = PLACES[i];
    const result = await generatePlacePin(place);
    placeResults.push({ ...place, ...result });

    if (i < PLACES.length - 1) {
      console.log("  (waiting 4s…)");
      await new Promise((r) => setTimeout(r, 4000));
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n\n═══════════════════════ SUMMARY ═══════════════════════");

  const modelUsed = usingFallback ? "dall-e-3 (fallback — gpt-image-1 blocked)" : "gpt-image-1";
  console.log(`\nModel used: ${modelUsed}`);

  const charOk   = charResults.filter((r) => r.success);
  const charFail = charResults.filter((r) => !r.success);

  console.log(`\nCharacter busts: ${charOk.length}/${CHARACTERS.length} OK`);
  for (const r of charOk) {
    console.log(`  ✓  ${r.name.padEnd(22)} → ${r.id}.png  (${r.sizeKB} KB)`);
  }
  for (const r of charFail) {
    console.log(`  ✗  ${(r.name ?? r.id).padEnd(22)} — ${r.reason}`);
  }

  const placeOk   = placeResults.filter((r) => r.success);
  const placeFail = placeResults.filter((r) => !r.success);

  console.log(`\nLocation stickers: ${placeOk.length}/${PLACES.length} OK`);
  for (const r of placeOk) {
    console.log(`  ✓  ${r.id.padEnd(22)} → places/${r.id}.png  (${r.sizeKB} KB)`);
  }
  for (const r of placeFail) {
    console.log(`  ✗  ${r.id.padEnd(22)} — ${r.reason}`);
  }

  console.log("\nDone.");

  const totalFail = charFail.length + placeFail.length;
  process.exit(totalFail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
