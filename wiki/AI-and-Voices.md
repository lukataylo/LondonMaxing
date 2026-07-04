# AI and Voices

Grudge Map uses four AI systems in a tightly coordinated pipeline. Each has a specific job; none does more than it needs to.

---

## 1. Gemini 2.5 Flash — story authorship

**What it does:** generates a historically-grounded, place-specific narrative (~150 words) in the first person voice of the figure, plus a real-world challenge for the user.

**Why Gemini:** structured output (`responseSchema`) eliminates brittle JSON parsing; Flash tier keeps latency and cost low.

**Prompt (server-side, `packages/ai`):**

```
System:
  You are the voice of {figureName} ({era}), speaking to a visitor who has just
  arrived at {address} in {timeOfDay} London.
  Write a short, vivid, historically-accurate monologue in the first person.
  Draw on real events, letters, and documented personality traits.
  Use period-appropriate British phrasing — never modern slang.
  End by issuing the visitor ONE achievable real-world challenge they can complete
  at this exact location right now.
  Length: 140–160 words for the narration.

User:
  The visitor is standing at {lat}, {lng}. Local time context: {timeOfDay}.
  Figure seed notes: {seed}

Response schema:
  {
    title: string,
    narration: string,
    challenge: {
      type: "photo" | "walk",
      instruction: string,
      targetMeters?: number
    }
  }
```

**Caching:** responses are cached by `figureId` on the server. New users hitting the same figure load the cached story; Gemini is only called once per figure (or when content is refreshed by an admin).

**Pre-generation:** at deploy time, `scripts/pregenerate-stories.ts` calls `/api/story` for every seed figure so the first user at any pin never waits for generation.

---

## 2. ElevenLabs Flash v2.5 — character voices

**What it does:** synthesises the Gemini-authored narration in a British voice matched to the historical period and persona of each figure.

**Endpoint:** `POST /api/tts { text, voiceId }` → streams `audio/mpeg` at `mp3_22050_32` (low bitrate — fast to stream, acceptable quality for speech).

**Voice assignment:** each figure in the seed data carries an `elevenlabs_voice_id`. Victorian figures use older-register male/female voices; WWII figures use more formal mid-century intonation. Voice selection is done editorially and stored in the figure seed JSON.

**iOS autoplay note:** TTS audio is initiated on the user's pin **tap** (a direct gesture), which satisfies Safari/iOS autoplay restrictions. The Expo shell uses `expo-audio` for additional reliability.

---

## 3. ElevenLabs Conversational AI + gpt-4o-mini — live dialogue

**What it does:** enables real-time, back-and-forth spoken conversation between the user and the historical figure.

**Architecture:**

```
User speaks (mic)
  └─► ElevenLabs Conversational AI agent
        ├─► speech-to-text (ElevenLabs)
        ├─► gpt-4o-mini (LLM backend, configured via ElevenLabs agent settings)
        │     System prompt: figure persona, knowledge boundaries, British register
        └─► text-to-speech in figure's voice (ElevenLabs Flash v2.5)
              └─► audio stream → user's speaker
```

**Implementation file:** `apps/web/src/voiceConversation.ts`

**System prompt structure for gpt-4o-mini (via ElevenLabs agent):**

```
You are {figureName}, speaking in {era} London.
You have detailed knowledge of your own life, work, and times up to {deathYear}.
You do not know about events after your death.
Speak in first person. Use British register and period-appropriate phrasing.
Be warm and engaged with the visitor — they have come to meet you specifically.
Keep each reply under 60 words so the conversation flows naturally.
If asked about something you cannot know, express genuine curiosity about what
the visitor is implying about the future.
```

**Acoustic echo cancellation** is enabled in the ElevenLabs agent configuration to prevent the mic from picking up the speaker output during conversation.

---

## 4. OpenAI gpt-image-1 — collectible stickers

**What it does:** takes the user's challenge photo and renders it as a stylised, period-appropriate illustrated sticker.

**Endpoint:** `POST /api/sticker { imageBase64 }` → `{ stickerUrl: string }` (PNG with transparent background)

**Prompt template:**

```
Transform this photo into a collectible illustrated sticker in the style of a
{era} engraving / portrait painting. Remove the background. Add a thin decorative
border consistent with {era} British aesthetic. Output as a transparent PNG.
The sticker should feel like a souvenir from {figureName}'s London.
```

The era and figure context are injected server-side based on the `figureId` sent with the sticker request.

**Walk challenge stickers:** when no user photo is available (walk challenge), gpt-image-1 generates a purely illustrated sticker — a vignette of the route walked, with no uploaded image.

---

## AI cost summary (per unlock event)

| Step | Provider | Approximate cost |
|------|----------|-----------------|
| Story generation | Gemini 2.5 Flash | ~£0.001 (cached after first hit: £0.000) |
| Narration TTS | ElevenLabs Flash v2.5 | ~£0.003 per story |
| Voice conversation (5 turns) | ElevenLabs + gpt-4o-mini | ~£0.008 |
| Sticker generation | gpt-image-1 | ~£0.04 |
| **Total per unlock (worst case)** | | **~£0.052** |

At a £7.99/month subscription with an assumed 20 unlocks/month per subscriber, AI cost is ~£1.04 and gross margin is ~87% before hosting and payment processing.

---

## Adding a new historical figure

1. Add the figure to `packages/shared/src/seed-figures.ts` with `{ id, name, lat, lng, era, voiceId, seed }`
2. Choose or clone an ElevenLabs voice; add the `voiceId` to the seed entry
3. Run `pnpm tsx scripts/pregenerate-stories.ts --figureId <id>` to pre-warm the story and TTS cache
4. Drop a pin SVG into `apps/web/public/pins/<id>.svg`
5. Deploy — the new figure appears on the map immediately
