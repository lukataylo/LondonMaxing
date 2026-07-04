// ─────────────────────────────────────────────────────────────────────────────
// Domain model — the FROZEN contract every track shares.
// Additive changes only once tracks are in flight (see OWNERSHIP.md).
// ─────────────────────────────────────────────────────────────────────────────

export type LatLng = { lat: number; lng: number };

/** A haunted location pinned to the map. */
export type GhostSpot = {
  id: string;
  title: string; // "The Weeping Lady of Dock St"
  lat: number;
  lng: number;
  /** metres; how close you must be to activate storytelling. Default 40. */
  unlockRadius: number;
  /** marker asset key for the 3D icon */
  icon: string;
  /** optional flavour seed fed to the story generator */
  seed?: string;
  /** true for hand-curated demo spots (pre-generated story/audio) vs live-generated */
  curated?: boolean;
};

export type ChallengeType = "selfie" | "walk";

export type Challenge =
  | { type: "selfie"; instruction: string }
  | { type: "walk"; instruction: string; targetMeters: number };

/** A generated (or pre-authored) ghost story for a spot. */
export type Story = {
  spotId: string;
  title: string;
  /** ~120–160 words, 2nd person, present tense, spooky-but-PG13 */
  narration: string;
  challenge: Challenge;
  /** populated after TTS; may be a URL or data URL */
  audioUrl?: string;
};

/** A captured memory: a photo turned into a sticker, filed under a day. */
export type Memory = {
  id: string;
  /** local calendar day, 'YYYY-MM-DD' */
  day: string;
  spotId: string;
  /** original capture (data URL or hosted) */
  photoUrl: string;
  /** background-removed, white-outlined sticker PNG */
  stickerUrl: string;
  caption?: string;
  lat: number;
  lng: number;
  createdAt: number; // epoch ms
};

/** A single geolocation fix after the OS/browser hands it to us. */
export type Fix = {
  lat: number;
  lng: number;
  /** reported accuracy in metres; we gate on this */
  accuracy: number;
  timestamp: number;
  /** true when injected by the debug teleport tool or the native bridge */
  synthetic?: boolean;
};

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
