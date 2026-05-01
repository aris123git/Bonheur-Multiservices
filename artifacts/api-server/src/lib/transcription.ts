import { openai } from "@workspace/integrations-openai-ai-server";
import { getTwilioAccountSid, getTwilioAuthToken } from "./twilio";
import { logger } from "./logger";
import { Readable } from "stream";

const AUDIO_CONTENT_TYPES = [
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "audio/wav",
  "audio/x-wav",
  "audio/amr",
  "audio/3gpp",
];

export function isAudioContentType(contentType: string): boolean {
  return AUDIO_CONTENT_TYPES.some((t) => contentType.startsWith(t));
}

export async function downloadTwilioMedia(mediaUrl: string): Promise<{ buffer: Buffer; contentType: string }> {
  const sid = getTwilioAccountSid();
  const token = getTwilioAuthToken();
  const credentials = Buffer.from(`${sid}:${token}`).toString("base64");

  const response = await fetch(mediaUrl, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to download Twilio media: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "audio/ogg";
  const arrayBuffer = await response.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), contentType };
}

function getExtensionForContentType(contentType: string): string {
  if (contentType.includes("ogg")) return "ogg";
  if (contentType.includes("mpeg") || contentType.includes("mp3")) return "mp3";
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("webm")) return "webm";
  if (contentType.includes("wav")) return "wav";
  if (contentType.includes("amr")) return "amr";
  return "ogg";
}

export async function transcribeAudio(buffer: Buffer, contentType: string): Promise<string> {
  const ext = getExtensionForContentType(contentType);
  const filename = `voice.${ext}`;

  // Convert buffer to a File-like object for the OpenAI SDK
  const readable = Readable.from(buffer);
  const file = Object.assign(readable, { name: filename }) as NodeJS.ReadableStream & { name: string };

  const response = await openai.audio.transcriptions.create({
    model: "gpt-4o-mini-transcribe",
    file: file as Parameters<typeof openai.audio.transcriptions.create>[0]["file"],
    response_format: "json",
    language: "fr",
  });

  return response.text.trim();
}

export async function transcribeTwilioVoiceMessage(mediaUrl: string): Promise<string | null> {
  try {
    logger.info({ mediaUrl }, "Downloading Twilio voice message");
    const { buffer, contentType } = await downloadTwilioMedia(mediaUrl);

    logger.info({ contentType, sizeBytes: buffer.length }, "Transcribing audio with Whisper");
    const transcript = await transcribeAudio(buffer, contentType);

    logger.info({ transcript }, "Audio transcribed successfully");
    return transcript;
  } catch (err) {
    logger.error({ err, mediaUrl }, "Failed to transcribe voice message");
    return null;
  }
}
