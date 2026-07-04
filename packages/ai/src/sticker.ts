// Sticker provider (T3). Server-side background removal via @imgly/background-removal-node.
// The white die-cut outline is applied client-side via CSS drop-shadow (cheap, instant);
// this provider just returns the transparent cutout. Stretch: gemini-2.5-flash-image.
// Docs: https://github.com/imgly/background-removal-js
import type { StickerRequest } from "@grudgemap/shared";
import type { StickerProvider } from "./types.js";

function normalizeBase64(input: string): string {
  return input.startsWith("data:") ? input.split(",", 2)[1] ?? "" : input;
}

export class ImglyStickerProvider implements StickerProvider {
  readonly name = "imgly";
  async cutout(req: StickerRequest) {
    const { removeBackground } = await import("@imgly/background-removal-node");
    const b64 = normalizeBase64(req.imageBase64);
    const inputBlob = new Blob([Buffer.from(b64, "base64")]);
    const out = await removeBackground(inputBlob);
    const png = new Uint8Array(await out.arrayBuffer());
    return { png };
  }
}
