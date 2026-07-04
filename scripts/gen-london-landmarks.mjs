/**
 * gen-london-landmarks.mjs
 *
 * Generates 12 glossy sticker-style icons for historically interesting
 * London landmarks, saved to apps/web/public/pins/places/<slug>.png.
 *
 * Reuses the same pipeline as gen-pins.mjs:
 *   1. POST /v1/images/generations → gpt-image-1 (transparent PNG)
 *   2. White die-cut outline (pngjs separable dilation)
 *   3. Downscale to ~256px (sharp)
 *   4. Write PNG
 *
 * Existing category stickers in pins/places/ are NOT touched.
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

// ── Output dir ────────────────────────────────────────────────────────────────

const PLACES_DIR = path.join(__dirname, "../apps/web/public/pins/places");
fs.mkdirSync(PLACES_DIR, { recursive: true });

// ── London landmark data ──────────────────────────────────────────────────────

const LANDMARKS = [
  {
    id: "british-museum",
    desc: "the British Museum neoclassical portico with grand Ionic columns and triangular pediment in pale stone",
  },
  {
    id: "st-pauls",
    desc: "St Paul's Cathedral with its iconic Wren dome and twin baroque towers in Portland stone",
  },
  {
    id: "tower-of-london",
    desc: "the White Tower keep of the Tower of London, a square Norman fortress with four corner turrets",
  },
  {
    id: "tower-bridge",
    desc: "Tower Bridge with its twin Victorian Gothic towers and blue steel bascule bridge over the Thames",
  },
  {
    id: "big-ben",
    desc: "Big Ben, the Elizabeth Tower clock tower with golden clock faces and Gothic stonework spire",
  },
  {
    id: "westminster-abbey",
    desc: "Westminster Abbey with twin Gothic towers, flying buttresses and ornate medieval stonework",
  },
  {
    id: "shakespeares-globe",
    desc: "Shakespeare's Globe Theatre, a round open-air timber-framed Elizabethan playhouse with thatched roof",
  },
  {
    id: "trafalgar-square",
    desc: "Trafalgar Square with Nelson's Column tall granite pillar topped by Admiral Nelson and a bronze lion at the base",
  },
  {
    id: "national-gallery",
    desc: "the National Gallery with its neoclassical columned facade, dome and wide stone steps on Trafalgar Square",
  },
  {
    id: "the-monument",
    desc: "the Monument to the Great Fire of London, a tall fluted stone Doric column topped with a golden flaming urn",
  },
  {
    id: "buckingham-palace",
    desc: "Buckingham Palace with its grand pale stone facade, central balcony, and Union Jack flag flying above",
  },
  {
    id: "covent-garden",
    desc: "Covent Garden Market Hall, a Georgian iron-and-glass market building with arched entrances and flower stalls",
  },
];

// ── OpenAI image generation ───────────────────────────────────────────────────

let usingFallback = false;

function buildLandmarkPrompt(landmark) {
  return (
    `die-cut sticker, glossy 3D miniature of ${landmark.desc}, ` +
    `vibrant saturated colours, thick white sticker border, ` +
    `transparent background, perfectly centered, cute travel-icon style, ` +
    `no text, no labels, no watermark`
  );
}

async function callOpenAI(prompt, model, extraParams = {}) {
  const body = { model, prompt, n: 1, ...extraParams };

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
      } else {
        throw err;
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
  const generated = await generateImage(prompt);
  console.log(
    `  generated: ${(generated.buffer.length / 1024).toFixed(1)} KB (model: ${generated.model})`
  );

  let transparent = generated.buffer;
  if (generated.model !== "gpt-image-1") {
    console.log("  removing background…");
    transparent = await stripBackground(generated.buffer);
    console.log(`  transparent: ${(transparent.length / 1024).toFixed(1)} KB`);
  }

  console.log(`  adding white die-cut border (${borderPx}px)…`);
  let bordered;
  try {
    bordered = addWhiteBorder(transparent, borderPx);
  } catch (err) {
    console.warn(`  border failed (using transparent): ${err.message}`);
    bordered = transparent;
  }

  console.log(`  downscaling to ~${targetPx}px…`);
  const final = await downscale(bordered, targetPx);

  fs.writeFileSync(outPath, final);
  const { size } = fs.statSync(outPath);
  console.log(`  saved: ${outPath} (${(size / 1024).toFixed(1)} KB)`);

  return { success: true, sizeKB: (size / 1024).toFixed(1), model: generated.model };
}

async function generateLandmarkPin(landmark) {
  console.log(`\n[LANDMARK] ${landmark.id}`);
  const prompt  = buildLandmarkPrompt(landmark);
  const outPath = path.join(PLACES_DIR, `${landmark.id}.png`);

  try {
    return await processImage(prompt, outPath, 256, 8);
  } catch (err) {
    console.error(`  FAIL: ${err.message}`);
    return { success: false, reason: err.message };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Grudge Map London Landmark Sticker Generator");
  console.log("==========================================");
  console.log(`Places dir: ${PLACES_DIR}\n`);
  console.log(`Generating ${LANDMARKS.length} landmark icons…\n`);

  const results = [];

  for (let i = 0; i < LANDMARKS.length; i++) {
    const landmark = LANDMARKS[i];
    const result   = await generateLandmarkPin(landmark);
    results.push({ ...landmark, ...result });

    if (i < LANDMARKS.length - 1) {
      console.log("  (waiting 4s…)");
      await new Promise((r) => setTimeout(r, 4000));
    }
  }

  console.log("\n\n═══════════════════════ SUMMARY ═══════════════════════");

  const modelUsed = usingFallback
    ? "dall-e-3 (fallback — gpt-image-1 blocked)"
    : "gpt-image-1";
  console.log(`\nModel used: ${modelUsed}`);

  const ok   = results.filter((r) => r.success);
  const fail = results.filter((r) => !r.success);

  console.log(`\nLandmark stickers: ${ok.length}/${LANDMARKS.length} OK`);
  for (const r of ok) {
    console.log(`  ✓  ${r.id.padEnd(26)} → places/${r.id}.png  (${r.sizeKB} KB)`);
  }
  for (const r of fail) {
    console.log(`  ✗  ${r.id.padEnd(26)} — ${r.reason}`);
  }

  console.log("\nDone.");

  process.exit(fail.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
