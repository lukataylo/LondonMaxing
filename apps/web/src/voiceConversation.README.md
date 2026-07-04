# Voice conversations with a historical character (ElevenLabs Conversational AI)

`voiceConversation.ts` lets a visitor have a real spoken back-and-forth with one
of the `CHARACTERS` (e.g. ask Karl Marx a question out loud, hear him answer in
his voice). It uses the **ElevenLabs Agents** platform (`@elevenlabs/client`)
over WebRTC.

This note documents the two pieces that live **outside** `voiceConversation.ts`:

1. the `/api/voice-token` backend endpoint the server must add, and
2. the ElevenLabs dashboard setup (creating the agent).

---

## 1. Backend endpoint — `POST /api/voice-token`

The ElevenLabs API key must stay server-side. The browser asks the backend for a
short-lived token; the backend mints it with `ELEVENLABS_API_KEY` (already held by
`apps/server`) and returns it. The token/URL is what `Conversation.startSession`
consumes.

### Contract (matches `VoiceTokenResponse` in `voiceConversation.ts`)

```
POST /api/voice-token
  body:  { "characterId": "karl-marx" }
  200:   { "conversationToken": "..."}   // WebRTC (recommended)
         // or { "signedUrl": "wss://..." }  // WebSocket alternative
         // or { "agentId": "agent_..." }    // public-agent demo fallback
```

### Sketch to add to `apps/server/src/index.ts`

```ts
// ── POST /api/voice-token — mint a short-lived ElevenLabs Agents token ──────────
// Add "voiceToken: '/api/voice-token'" to API_ROUTES in @grudgemap/shared first.
app.post("/api/voice-token", async (c) => {
  try {
    const { characterId } = (await parseJsonBody(c)) as { characterId?: string };
    if (!characterId) throw new BadRequestError("characterId is required");

    const apiKey = env.ELEVENLABS_API_KEY;
    const agentId = env.ELEVENLABS_AGENT_ID; // see §2 (one shared agent is fine —
                                             // persona/voice are sent as overrides)
    if (!apiKey || !agentId) {
      return c.json<ApiError>({ error: "Voice agent not configured" }, 503);
    }

    // WebRTC (recommended): GET a conversation token.
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      { headers: { "xi-api-key": apiKey } },
    );
    // WebSocket alternative:
    //   `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`
    //   → returns { signed_url }; respond with { signedUrl: body.signed_url }

    if (!res.ok) return c.json<ApiError>({ error: "ElevenLabs token failed" }, 502);
    const body = (await res.json()) as { token: string };
    return c.json({ conversationToken: body.token });
  } catch (err) {
    return routeError(c, err, "voice-token");
  }
});
```

Notes:
- The conversation token is short-lived; a signed URL expires after ~15 minutes.
  Both are minted per session, so this endpoint is called on every "start".
- `characterId` is accepted so you *could* map characters to different dashboard
  agents/voices. With the override approach below, one agent serves all eight.

---

## 2. ElevenLabs dashboard setup (do this first — nothing works without it)

1. **Create a Conversational AI agent**: ElevenLabs dashboard → **Agents** →
   *Create agent*. A blank/Default template is fine.
2. **Copy the `agent_id`** (looks like `agent_xxxx…`) into the server env as
   `ELEVENLABS_AGENT_ID` (Railway variable in prod, `.env.local` in dev).
3. **Pick a voice** for the agent (Agent → *Voice*). The client sends a per-
   character system prompt + first message, but the *voice* is the agent's
   dashboard voice unless you pass a real `voiceId` (see below). For best results,
   either create one agent per character with a matching voice, or clone/choose
   voices that fit each `voiceHint` and pass their ids via
   `useVoiceConversation({ voiceIdFor })`.
4. **Enable overrides** (Agent → *Security* / *Overrides*): allow overriding the
   **System prompt**, **First message**, **Language**, and (if you use per-
   character voices) **Voice**. `voiceConversation.ts` sends these as
   `overrides`; if a field is not allowlisted, ElevenLabs ignores that override
   and falls back to the dashboard value.
5. **Authentication**: keep the agent **private** (auth enabled) for production so
   it can only be reached with a server-minted token. For a quick demo you may
   disable auth and return `{ agentId }` from `/api/voice-token` instead.
6. **Allowed origins / CORS** (Agent → *Security*): add the web app's origin
   (and `http://localhost:5173` for local dev).

The per-character persona comes from `CHARACTERS[].persona` and the speaking
style from `CHARACTERS[].voiceHint` (shaped by `buildSystemPrompt` /
`buildFirstMessage` in `voiceConversation.ts`), so the agent's own dashboard
prompt can stay generic.

---

## 3. What works now vs. what's left

**Works now (in this repo, no install needed):**
- `voiceConversation.ts` type-checks and `pnpm --filter @grudgemap/web build` passes
  with `@elevenlabs/client` *not* installed (dynamic import behind an indirected
  specifier + local typed wrapper).
- Prompt/first-message shaping from a `Character`, token-fetch + session
  lifecycle, mic/playback handling (done by the SDK), transcript, speaking state,
  volume, and clean teardown are all implemented.

**Left to make it live (in order):**
1. **Dashboard**: create the agent, enable overrides, set a voice — §2 above.
   Set `ELEVENLABS_AGENT_ID` on the server.
2. **Backend**: add `POST /api/voice-token` (and the `voiceToken` route to
   `@grudgemap/shared`'s `API_ROUTES`) — §1 above.
3. **Install the dep**: `pnpm --filter @grudgemap/web add @elevenlabs/client`.
   (For React-Provider ergonomics you could use `@elevenlabs/react`'s
   `useConversation` instead; this module uses the framework-agnostic client so
   it stays self-contained and needs no provider in the tree.)
4. **Wire the UI**: import `useVoiceConversation` in a character screen, add
   "Talk" / "Stop" buttons, and request mic permission on a user gesture (browsers
   require a click before `getUserMedia`/audio playback). HTTPS (or localhost) is
   required for mic access.

Until steps 1–2 are done, `start()` returns a clean error (`voice-token request
failed` or the missing-dep message) and the UI stays on the local demo content —
nothing else breaks.
