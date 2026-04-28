import { Router, type IRouter, type Request } from "express";
import twilio from "twilio";
import {
  getTwilioAuthToken,
  getTwilioClient,
  getTwilioWhatsAppNumber,
} from "../lib/twilio";
import {
  getConversationHistory,
  handleIncomingMessage,
  resetConversation,
} from "../lib/claudeBot";

const router: IRouter = Router();

function getPublicUrl(req: Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string) ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string) ?? req.get("host");
  return `${proto}://${host}${req.originalUrl.split("?")[0]}`;
}

router.post("/whatsapp/webhook", async (req, res) => {
  const signature = req.header("X-Twilio-Signature");
  const url = getPublicUrl(req);
  const params = (req.body ?? {}) as Record<string, string>;

  const isValid =
    process.env["NODE_ENV"] === "development" ||
    (signature
      ? twilio.validateRequest(getTwilioAuthToken(), signature, url, params)
      : false);

  if (!isValid) {
    req.log.warn(
      { url, hasSignature: Boolean(signature) },
      "Rejected webhook with invalid Twilio signature",
    );
    res.status(403).type("text/plain").send("Invalid Twilio signature");
    return;
  }

  const from = String(params["From"] ?? "");
  const body = String(params["Body"] ?? "");
  const profileName = params["ProfileName"]
    ? String(params["ProfileName"])
    : undefined;
  const numMedia = Number(params["NumMedia"] ?? 0);

  req.log.info(
    { from, hasBody: body.length > 0, numMedia },
    "Incoming WhatsApp message",
  );

  try {
    const replyText = await handleIncomingMessage({
      phoneNumber: from,
      profileName,
      body,
      numMedia,
    });

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(replyText);

    res.type("text/xml").send(twiml.toString());
  } catch (err) {
    req.log.error({ err }, "Failed to handle WhatsApp message");
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(
      "Désolé, une erreur s'est produite. Peux-tu réessayer dans un instant ?",
    );
    res.type("text/xml").send(twiml.toString());
  }
});

router.get("/whatsapp/history/:phoneNumber", async (req, res) => {
  const phoneNumber = req.params["phoneNumber"];
  if (!phoneNumber) {
    res.status(400).json({ error: "phoneNumber is required" });
    return;
  }
  const formatted = phoneNumber.startsWith("whatsapp:")
    ? phoneNumber
    : `whatsapp:${phoneNumber}`;
  const data = await getConversationHistory(formatted);
  res.json(data);
});

router.delete("/whatsapp/history/:phoneNumber", async (req, res) => {
  const phoneNumber = req.params["phoneNumber"];
  if (!phoneNumber) {
    res.status(400).json({ error: "phoneNumber is required" });
    return;
  }
  const formatted = phoneNumber.startsWith("whatsapp:")
    ? phoneNumber
    : `whatsapp:${phoneNumber}`;
  const cleared = await resetConversation(formatted);
  res.json({ cleared });
});

router.post("/whatsapp/send", async (req, res) => {
  const { to, body } = (req.body ?? {}) as { to?: string; body?: string };

  if (!to || !body) {
    res.status(400).json({ error: "Both 'to' and 'body' are required." });
    return;
  }

  try {
    const client = getTwilioClient();
    const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    const message = await client.messages.create({
      from: getTwilioWhatsAppNumber(),
      to: formattedTo,
      body,
    });

    res.json({
      sid: message.sid,
      status: message.status,
      to: message.to,
      from: message.from,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to send WhatsApp message");
    const errorMessage =
      err instanceof Error ? err.message : "Failed to send message";
    res.status(500).json({ error: errorMessage });
  }
});

router.get("/whatsapp/status", (_req, res) => {
  const hasSid = Boolean(process.env["TWILIO_ACCOUNT_SID"]);
  const hasToken = Boolean(process.env["TWILIO_AUTH_TOKEN"]);
  const hasNumber = Boolean(process.env["TWILIO_WHATSAPP_NUMBER"]);
  res.json({
    configured: hasSid && hasToken && hasNumber,
    twilioAccountSid: hasSid,
    twilioAuthToken: hasToken,
    twilioWhatsAppNumber: hasNumber,
  });
});

export default router;
