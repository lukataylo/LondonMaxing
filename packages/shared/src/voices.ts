// ─────────────────────────────────────────────────────────────────────────────
// ElevenLabs voice assignments for Grudge Map historical guides.
// Voice IDs come from GET /v1/voices on this account (listed 2026-06-13).
// All voices are British-accented; gender matched to each historical figure.
//
// Guide                  → Voice name                          | Gender | Accent
// ─────────────────────────────────────────────────────────────────────────────
// ada-lovelace           → Alice - British Female (young)      | Female | British
// virginia-woolf         → Lily - Velvety Actress              | Female | British
// mary-seacole           → Alice - Clear, Engaging Educator    | Female | British
// emmeline-pankhurst     → Grace - 25-35 Year Old British      | Female | British
// winston-churchill      → Daniel - Steady Broadcaster         | Male   | British
// sherlock-holmes        → Daniel - Steady Broadcaster         | Male   | British
// samuel-johnson         → Daniel - Steady Broadcaster         | Male   | British
// karl-marx              → Daniel - Steady Broadcaster         | Male   | British
// charles-dickens        → George - Warm, Captivating Storyteller | Male | British
// john-logie-baird       → George - Warm, Captivating Storyteller | Male | British
// christopher-wren       → George - Warm, Captivating Storyteller | Male | British
// jimi-hendrix           → George - Warm, Captivating Storyteller | Male | British
// ─────────────────────────────────────────────────────────────────────────────
// Note: Only 2 British male voices exist on this account (Daniel & George).
// Daniel (formal/analytical) covers figures who need gravitas or precision.
// George (warm/narrative) covers storytellers and inventors.
// ─────────────────────────────────────────────────────────────────────────────

/** Maps each Grudge Map guide/character ID to an ElevenLabs voice ID. */
export const VOICE_BY_GUIDE: Record<string, string> = {
  // ── Science ────────────────────────────────────────────────────────────────
  "ada-lovelace":    "9rh371MqHF5jaDZ7VPvk",  // Alice - British Female (young, calm)
  "john-logie-baird":"JBFqnCBsd6RMkjVDRZzb",  // George - Warm, Captivating Storyteller (british, middle-aged)

  // ── Politics ───────────────────────────────────────────────────────────────
  "winston-churchill":   "onwK4e9ZLuTAKqWW03F9", // Daniel - Steady Broadcaster (british, formal, authoritative)
  "karl-marx":           "onwK4e9ZLuTAKqWW03F9", // Daniel - Steady Broadcaster (british, deliberate, weighty)
  "emmeline-pankhurst":  "LZAcK8Cx5QjdQhfBsJQZ", // Grace - 25-35 Year Old British Female (british, passionate)

  // ── Literature ─────────────────────────────────────────────────────────────
  "charles-dickens": "JBFqnCBsd6RMkjVDRZzb",  // George - Warm, Captivating Storyteller (british, middle-aged)
  "virginia-woolf":  "pFZP5JQG7iQjIQuC4Bku",  // Lily - Velvety Actress (british, refined, literary)
  "samuel-johnson":  "onwK4e9ZLuTAKqWW03F9",  // Daniel - Steady Broadcaster (british, formal, elder statesman)

  // ── History ────────────────────────────────────────────────────────────────
  "mary-seacole":    "Xb7hH8MSUJpSbSDYk0k2",  // Alice - Clear, Engaging Educator (british, professional, middle-aged)
  "sherlock-holmes": "onwK4e9ZLuTAKqWW03F9",  // Daniel - Steady Broadcaster (british, crisp, analytical)

  // ── Music ──────────────────────────────────────────────────────────────────
  "jimi-hendrix":    "JBFqnCBsd6RMkjVDRZzb",  // George - Warm, Captivating Storyteller (british, engaging)

  // ── Architecture / Science ─────────────────────────────────────────────────
  "christopher-wren":"JBFqnCBsd6RMkjVDRZzb",  // George - Warm, Captivating Storyteller (british, mature)
};

/**
 * Fallback voice used when a guide ID is not found in VOICE_BY_GUIDE.
 * George: Warm, Captivating Storyteller — British, male, middle-aged, versatile narrative voice.
 */
export const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
