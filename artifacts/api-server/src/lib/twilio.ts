import twilio from "twilio";
import type { Twilio } from "twilio";

let cachedClient: Twilio | null = null;

export function getTwilioClient(): Twilio {
  if (cachedClient) return cachedClient;

  const sid = process.env["TWILIO_ACCOUNT_SID"];
  const token = process.env["TWILIO_AUTH_TOKEN"];

  if (!sid || !token) {
    throw new Error(
      "TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in the environment.",
    );
  }

  cachedClient = twilio(sid, token);
  return cachedClient;
}

export function getTwilioWhatsAppNumber(): string {
  const number = process.env["TWILIO_WHATSAPP_NUMBER"];
  if (!number) {
    throw new Error(
      "TWILIO_WHATSAPP_NUMBER must be set in the environment (format: 'whatsapp:+14155238886').",
    );
  }
  return number.startsWith("whatsapp:") ? number : `whatsapp:${number}`;
}

export function getTwilioAuthToken(): string {
  const token = process.env["TWILIO_AUTH_TOKEN"];
  if (!token) {
    throw new Error("TWILIO_AUTH_TOKEN must be set in the environment.");
  }
  return token;
}

export function getTwilioAccountSid(): string {
  const sid = process.env["TWILIO_ACCOUNT_SID"];
  if (!sid) {
    throw new Error("TWILIO_ACCOUNT_SID must be set in the environment.");
  }
  return sid;
}

export async function sendWhatsAppMessage(
  toPhone: string,
  body: string,
): Promise<void> {
  const client = getTwilioClient();
  const from = getTwilioWhatsAppNumber();
  const to = toPhone.startsWith("whatsapp:") ? toPhone : `whatsapp:${toPhone}`;
  await client.messages.create({ from, to, body });
}
