import { anthropic } from "@workspace/integrations-anthropic-ai";
import { and, asc, eq } from "drizzle-orm";
import {
  db,
  whatsappConversations,
  whatsappMessages,
  whatsappTransactions,
} from "@workspace/db";
import { logger } from "./logger";
import { sendWhatsAppMessage } from "./twilio";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8192;
const HISTORY_LIMIT = 30;
const TWILIO_WHATSAPP_MAX_CHARS = 1500;

const SYSTEM_PROMPT = `Tu t'appelles Awa, assistante de Bonheur Multiservices. Tu aides les clients pour leurs dépôts et retraits 1xBet. Sois chaleureuse et naturelle comme une vraie personne en Afrique de l'Ouest. Utilise des emojis avec modération. Pose UNE seule question à la fois. Ne te présente jamais comme un bot. Parle toujours en français informel et familier.

Quand quelqu'un dit bonjour ou écrit pour la première fois, réponds chaleureusement et demande directement : est-ce pour un dépôt ou un retrait sur 1xBet ?

---

🔵 Si le client veut faire un DÉPÔT, collecte dans cet ordre :
1. Le montant à déposer (en FCFA)
2. Son identifiant de compte 1xBet
3. L'opérateur mobile money : Orange, Moov ou Wave
4. Le numéro mobile money à débiter

---

🔴 Si le client veut faire un RETRAIT, collecte dans cet ordre :
1. Le montant à retirer (en FCFA)
2. Son identifiant de compte 1xBet
3. L'opérateur mobile money : Orange, Moov ou Wave
4. Le numéro de téléphone sur lequel il veut recevoir l'argent

---

Une fois que tu as TOUTES les informations, fais un récapitulatif clair au client avant d'enregistrer. Exemple pour un retrait :
"Voici le récapitulatif de ta demande :
- Retrait de [montant] FCFA
- Compte 1xBet : [ID]
- Opérateur : [opérateur]
- Numéro à créditer : [numéro]
C'est bien ça ? 😊"

Si le client confirme, appelle immédiatement l'outil create_transaction avec toutes les informations.
N'appelle l'outil QUE lorsque le client a confirmé le récapitulatif.`;

const CREATE_TRANSACTION_TOOL = {
  name: "create_transaction",
  description:
    "Enregistre une nouvelle demande de dépôt ou retrait 1xBet une fois que toutes les informations ont été collectées auprès du client.",
  input_schema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["dépôt", "retrait"],
        description: "Type de transaction",
      },
      amount: {
        type: "string",
        description: "Montant en FCFA (ex: '5000')",
      },
      oneXBetId: {
        type: "string",
        description: "Identifiant du compte 1xBet du client",
      },
      operator: {
        type: "string",
        description: "Opérateur mobile money : Orange, Moov ou Wave",
      },
      operatorPhone: {
        type: "string",
        description: "Pour un dépôt : numéro mobile money à débiter. Pour un retrait : numéro de téléphone à créditer.",
      },
    },
    required: ["type", "amount", "oneXBetId", "operator", "operatorPhone"],
  },
} as const;

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

function getAgentPhone(): string | null {
  return process.env["AGENT_PHONE_NUMBER"] ?? null;
}

async function notifyAgent(
  clientPhone: string,
  type: string,
  amount: string,
  oneXBetId: string,
): Promise<void> {
  const agentPhone = getAgentPhone();
  if (!agentPhone) {
    logger.warn("AGENT_PHONE_NUMBER not set — skipping agent notification");
    return;
  }
  const bare = clientPhone.replace(/^whatsapp:/, "");
  const message = `🔔 Nouvelle demande de ${bare} - ${type} de ${amount} FCFA sur compte 1xBet ${oneXBetId}`;
  try {
    await sendWhatsAppMessage(agentPhone, message);
  } catch (err) {
    logger.error({ err, agentPhone }, "Failed to send agent notification");
  }
}

interface TransactionInput {
  type: string;
  amount: string;
  oneXBetId: string;
  operator: string;
  operatorPhone: string;
}

async function handleCreateTransaction(
  clientPhone: string,
  input: TransactionInput,
): Promise<string> {
  const [row] = await db
    .insert(whatsappTransactions)
    .values({
      clientPhone,
      type: input.type,
      amount: input.amount,
      oneXBetId: input.oneXBetId,
      operator: input.operator,
      operatorPhone: input.operatorPhone,
    })
    .returning({ id: whatsappTransactions.id });

  logger.info(
    { transactionId: row?.id, clientPhone, type: input.type },
    "Transaction created",
  );

  await notifyAgent(clientPhone, input.type, input.amount, input.oneXBetId);

  return JSON.stringify({ success: true, transactionId: row?.id });
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
      tools: [CREATE_TRANSACTION_TOOL],
      messages,
    });

    // Handle tool use (create_transaction)
    if (response.stop_reason === "tool_use") {
      const toolUse = response.content.find((b) => b.type === "tool_use");
      if (toolUse && toolUse.type === "tool_use" && toolUse.name === "create_transaction") {
        const input = toolUse.input as TransactionInput;
        const toolResult = await handleCreateTransaction(ctx.phoneNumber, input);

        // Send tool result back to Claude for the final reply
        const followUp = await anthropic.messages.create({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: SYSTEM_PROMPT,
          tools: [CREATE_TRANSACTION_TOOL],
          messages: [
            ...messages,
            { role: "assistant" as const, content: response.content },
            {
              role: "user" as const,
              content: [
                {
                  type: "tool_result" as const,
                  tool_use_id: toolUse.id,
                  content: toolResult,
                },
              ],
            },
          ],
        });

        const textBlock = followUp.content.find((b) => b.type === "text");
        const assistantText =
          textBlock && textBlock.type === "text"
            ? textBlock.text.trim()
            : "Ta demande a bien été enregistrée ! On la traite rapidement. 🙏";

        await saveMessage(conversationId, "assistant", assistantText);
        return truncateForWhatsApp(assistantText);
      }
    }

    // Normal text response
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
    .where(and(eq(whatsappMessages.conversationId, conv[0].id)));
  return true;
}
