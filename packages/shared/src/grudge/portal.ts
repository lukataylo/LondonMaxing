// ─────────────────────────────────────────────────────────────────────────────
// Time Portal — era cards + the grounded prompt assembler.
//
// "Point your camera at any London street and watch it dissolve into 1890s, 1943,
// 1974, or the future the modernists promised. Every render is grounded in what
// actually stood there."
//
// The grounding rule (PRD §5): a render prompt is NEVER model imagination alone.
//   prompt = era style card
//          + this location's verified facts (from the stop fact pack)
//          + composition lock (keep street geometry / camera angle / sightlines)
// If a location has no fact pack, the era dial greys out — refusing to hallucinate
// is a feature and a pitch line.
// ─────────────────────────────────────────────────────────────────────────────

import type { FactPack } from "./types.js";

export type EraId = "1890s" | "1943" | "1974" | "2050";

export interface EraCard {
  id: EraId;
  /** dial label, e.g. "1943". */
  label: string;
  /** one-line dial subtitle. */
  tagline: string;
  /** period-correct materials, vehicles, signage, light (fed to the model). */
  styleCard: string;
  /** things to actively keep OUT of frame (wrong-era drift). */
  negativePrompt: string;
  /** CSS fallback filter when the image API is slow/unavailable (theatre). */
  cssFilter: string;
  /** hex tint for the fallback overlay + dial accent. */
  tint: string;
}

export const ERAS: EraCard[] = [
  {
    id: "1890s",
    label: "1890s",
    tagline: "Gaslight & horse traffic",
    styleCard:
      "Late-Victorian London, 1890s. Soot-darkened yellow-stock brick, hand-painted shop fascias and gilded signwriting, cast-iron gas street lamps with a warm flickering glow, horse-drawn carts and hansom cabs, cobbled and granite-sett road, men in bowler hats and women in long skirts, coal-smoke haze softening the light, sepia-tinged overcast sky.",
    negativePrompt:
      "no cars, no tarmac, no plastic, no modern signage, no electric lighting, no yellow lines, no CCTV, no satellite dishes, no modern clothing.",
    cssFilter: "sepia(0.65) contrast(1.05) brightness(0.92) saturate(0.7)",
    tint: "#7a5a2e",
  },
  {
    id: "1943",
    label: "1943",
    tagline: "The Blitz, blacked-out",
    styleCard:
      "London during the Second World War, 1943. Blackout blinds and taped windows, sandbags stacked at doorways, an EWS static-water tank, a barrage balloon high in a searchlit sky, shrapnel-scarred brickwork and a gap-toothed bombed terrace, an Anderson-shelter, wartime austerity posters, a lone 1940s Austin, people in utility coats and tin helmets, cold grey-blue smoky light.",
    negativePrompt:
      "no modern cars, no colour advertising, no smartphones, no plastic, no bright neon, no contemporary clothing, no tarmac road markings.",
    cssFilter: "grayscale(0.7) contrast(1.15) brightness(0.8) sepia(0.15)",
    tint: "#3d4550",
  },
  {
    id: "1974",
    label: "1974",
    tagline: "Cortinas & faded fascias",
    styleCard:
      "Dalston, east London, 1974. Grimy post-war brick, faded painted shopfronts and launderettes, a Ford Cortina and a Routemaster bus, market stalls with hand-lettered price cards, weathered fly-posters and reggae/soul record-shop signage, sodium street lamps, kerbside litter, flared trousers and sheepskin coats, overcast 1970s colour-film stock with muted greens and browns.",
    negativePrompt:
      "no modern cars, no LED lighting, no smartphones, no glass towers, no contemporary chain-store branding, no clean surfaces.",
    cssFilter: "sepia(0.35) contrast(1.05) saturate(0.85) hue-rotate(-8deg) brightness(0.95)",
    tint: "#6b5d3a",
  },
  {
    id: "2050",
    label: "2050",
    tagline: "The modernists' promise",
    styleCard:
      "London 2050, the utopian future the modernists promised finally delivered. Pedestrianised street with no cars, board-marked concrete softened by hanging gardens and mature trees, a silent elevated mono-rail, solar-glass canopies, clean warm-lit signage, people cycling and walking, bright optimistic daylight, brutalism reborn as green and humane.",
    negativePrompt:
      "no dystopian decay, no flying cars, no neon cyberpunk clichés, no dirt or ruin, no petrol vehicles, no advertising clutter.",
    cssFilter: "saturate(1.25) contrast(1.02) brightness(1.08) hue-rotate(8deg)",
    tint: "#2f8f7a",
  },
];

export function getEra(id: string): EraCard | undefined {
  return ERAS.find((e) => e.id === id);
}

/** Keep the real street; re-render only era styling. */
export const COMPOSITION_LOCK =
  "COMPOSITION LOCK — this is a re-render of the EXACT photograph provided. Keep the identical street geometry, building footprints, camera angle, perspective, horizon and sightlines. Do not move, add, or remove buildings, and do not change the framing or crop. Restyle ONLY the surface materials, era-appropriate vehicles, signage, people's clothing, and the quality of light.";

/**
 * Assemble the full image-to-image prompt: era card + verified location facts +
 * composition lock. Returns null when there is no usable fact pack (the dial
 * should be greyed out and the app should say why).
 */
export function buildPortalPrompt(
  era: EraCard,
  pack: FactPack | undefined,
  placeName: string,
): string | null {
  const facts = pack?.facts?.map((f) => `- ${f.text}`) ?? [];
  if (facts.length === 0) return null; // refuse to hallucinate (PRD §5)
  return [
    `Re-render this photograph of ${placeName} (Dalston, London) as it would have looked in ${era.label}.`,
    "",
    `ERA STYLE CARD: ${era.styleCard}`,
    "",
    "VERIFIED LOCATION FACTS — the render must be consistent with these and contradict none of them:",
    ...facts,
    "",
    COMPOSITION_LOCK,
    "",
    `AVOID: ${era.negativePrompt}`,
  ].join("\n");
}

/** Two grounding lines + the source names for the postcard caption (PRD F4). */
export interface PortalCaption {
  lines: string[];
  sources: string[];
}

export function buildPortalCaption(pack: FactPack | undefined): PortalCaption {
  if (!pack || pack.facts.length === 0) {
    return { lines: ["No verified history for this spot — the dial stays dark."], sources: [] };
  }
  const chosen = pack.facts.slice(0, 2);
  return {
    lines: chosen.map((f) => f.text),
    sources: Array.from(new Set(chosen.map((f) => f.source))),
  };
}
