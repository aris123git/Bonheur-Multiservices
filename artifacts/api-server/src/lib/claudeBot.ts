import { anthropic } from "@workspace/integrations-anthropic-ai";
import { and, asc, eq } from "drizzle-orm";
import {
  db,
  whatsappConversations,
  whatsappMessages,
} from "@workspace/db";
import { logger } from "./logger";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8192;
const HISTORY_LIMIT = 30;
const TWILIO_WHATSAPP_MAX_CHARS = 1500;

const SYSTEM_PROMPT = `Tu es un assistant conversationnel intelligent et chaleureux qui communique via WhatsApp. Tu réponds toujours en français, quel que soit la langue dans laquelle l'utilisateur t'écrit.

Règles essentielles :
- Réponds toujours en français, dans un ton amical, naturel et conversationnel.
- Garde tes réponses concises et adaptées à WhatsApp : utilise des phrases courtes et des paragraphes courts. Évite les réponses trop longues (idéalement moins de 1500 caractères).
- Tu peux utiliser le formatage WhatsApp avec parcimonie : *gras*, _italique_, ~barré~, et \`\`\`code\`\`\`.
- N'utilise pas d'emojis sauf si l'utilisateur en utilise lui-même.
- N'utilise pas de Markdown comme # ou des listes complexes — préfère des tirets simples ou des phrases.
- Si l'utilisateur écrit dans une autre langue, comprends-le mais réponds en français.
- Si tu ne sais pas quelque chose, dis-le honnêtement.
- Tu te souviens de la conversation en cours avec cet utilisateur.`;

export interface BotContext {
  phoneNumber: string;
  profileName?: string;
  body: string;
  numMedia: number;
}

async function getOrCreateConversation(
  phoneNumber: string,
  profileName: string | undefined,
): Promise<number> {
  const existing = await db
    .select()
    .from(whatsappConversations)
    .where(eq(whatsappConversations.phoneNumber, phoneNumber))
    .limit(1);

  if (existing.length > 0 && existing[0]) {
    if (profileName && profileName !== existing[0].profileName) {
      await db
        .update(whatsappConversations)
        .set({ profileName, updatedAt: new Date() })
        .where(eq(whatsappConversations.id, existing[0].id));
    }
    return existing[0].id;
  }

  const inserted = await db
    .insert(whatsappConversations)
    .values({ phoneNumber, profileName: profileName ?? null })
    .returning({ id: whatsappConversations.id });

  if (!inserted[0]) {
    throw new Error("Failed to create conversation");
  }
  return inserted[0].id;
}

async function loadHistory(
  conversationId: number,
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const rows = await db
    .select({
      role: whatsappMessages.role,
      content: whatsappMessages.content,
    })
    .from(whatsappMessages)
    .where(eq(whatsappMessages.conversationId, conversationId))
    .orderBy(asc(whatsappMessages.createdAt))
    .limit(HISTORY_LIMIT);

  return rows
    .filter((r): r is { role: "user" | "assistant"; content: string } =>
      r.role === "user" || r.role === "assistant",
    )
    .map((r) => ({ role: r.role, content: r.content }));
}

async function saveMessage(
  conversationId: number,
  role: "user" | "assistant",
  content: string,
): Promise<void> {
  await db.insert(whatsappMessages).values({
    conversationId,
    role,
    content,
  });
  await db
    .update(whatsappConversations)
    .set({ updatedAt: new Date() })
    .where(eq(whatsappConversations.id, conversationId));
}

async function clearConversation(conversationId: number): Promise<void> {
  await db
    .delete(whatsappMessages)
    .where(eq(whatsappMessages.conversationId, conversationId));
}

function truncateForWhatsApp(text: string): string {
  if (text.length <= TWILIO_WHATSAPP_MAX_CHARS) return text;
  return `${text.slice(0, TWILIO_WHATSAPP_MAX_CHARS - 3).trimEnd()}...`;
}

function isResetCommand(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    t === "/reset" ||
    t === "/clear" ||
    t === "reset" ||
    t === "réinitialiser" ||
    t === "recommencer"
  );
}

export async function handleIncomingMessage(
  ctx: BotContext,
): Promise<string> {
  const conversationId = await getOrCreateConversation(
    ctx.phoneNumber,
    ctx.profileName,
  );

  const userText = ctx.body.trim();

  if (isResetCommand(userText)) {
    await clearConversation(conversationId);
    return "D'accord, j'ai effacé notre conversation. On repart de zéro. De quoi veux-tu parler ?";
  }

  if (!userText && ctx.numMedia > 0) {
    return "Merci pour le média ! Pour l'instant, je ne peux traiter que du texte. Écris-moi un message et je te répondrai avec plaisir.";
  }

  if (!userText) {
    return "Je suis là ! Écris-moi un message et je te répondrai.";
  }

  const history = await loadHistory(conversationId);
  await saveMessage(conversationId, "user", userText);

  const messages = [
    ...history,
    { role: "user" as const, content: userText },
  ];

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const assistantText =
      textBlock && textBlock.type === "text"
        ? textBlock.text.trim()
        : "Désolé, je n'ai pas pu générer de réponse. Peux-tu reformuler ?";

    await saveMessage(conversationId, "assistant", assistantText);

    return truncateForWhatsApp(assistantText);
  } catch (err) {
    logger.error({ err, phoneNumber: ctx.phoneNumber }, "Claude API error");
    return "Désolé, j'ai un petit souci technique pour le moment. Peux-tu réessayer dans un instant ?";
  }
}

export async function getConversationHistory(
  phoneNumber: string,
): Promise<{
  conversation: { phoneNumber: string; profileName: string | null } | null;
  messages: Array<{ role: string; content: string; createdAt: Date }>;
}> {
  const conv = await db
    .select()
    .from(whatsappConversations)
    .where(eq(whatsappConversations.phoneNumber, phoneNumber))
    .limit(1);

  if (conv.length === 0 || !conv[0]) {
    return { conversation: null, messages: [] };
  }

  const msgs = await db
    .select({
      role: whatsappMessages.role,
      content: whatsappMessages.content,
      createdAt: whatsappMessages.createdAt,
    })
    .from(whatsappMessages)
    .where(eq(whatsappMessages.conversationId, conv[0].id))
    .orderBy(asc(whatsappMessages.createdAt));

  return {
    conversation: {
      phoneNumber: conv[0].phoneNumber,
      profileName: conv[0].profileName,
    },
    messages: msgs,
  };
}

export async function resetConversation(phoneNumber: string): Promise<boolean> {
  const conv = await db
    .select({ id: whatsappConversations.id })
    .from(whatsappConversations)
    .where(eq(whatsappConversations.phoneNumber, phoneNumber))
    .limit(1);

  if (conv.length === 0 || !conv[0]) return false;

  await db
    .delete(whatsappMessages)
    .where(
      and(eq(whatsappMessages.conversationId, conv[0].id)),
    );
  return true;
}
