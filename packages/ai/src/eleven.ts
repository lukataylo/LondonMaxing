// ElevenLabs TTS provider (T3). Model eleven_flash_v2_5 (~75ms), low-latency mp3.
// Keep the key server-side only. Docs: https://elevenlabs.io/docs
import type { TtsRequest } from "@grudgemap/shared";
import type { TtsProvider } from "./types.js";

export type ElevenOptions = {
  apiKey: string;
  defaultVoiceId: string;
  model?: string;
  outputFormat?: string;
};

export class ElevenTtsProvider implements TtsProvider {
  readonly name = "eleven";
  private apiKey: string;
  private defaultVoiceId: string;
  private model: string;
  private outputFormat: string;

  constructor(opts: ElevenOptions) {
    this.apiKey = opts.apiKey;
    this.defaultVoiceId = opts.defaultVoiceId;
    this.model = opts.model ?? "eleven_flash_v2_5";
    this.outputFormat = opts.outputFormat ?? "mp3_22050_32";
  }

  async synthesize(req: TtsRequest) {
    const voiceId = req.voiceId ?? this.defaultVoiceId;
    const url =
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream` +
      `?output_format=${this.outputFormat}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": this.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({ text: req.text, model_id: this.model }),
    });
    if (!res.ok) {
      throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    return { audio: buf, contentType: "audio/mpeg" };
  }
}
