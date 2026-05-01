import { Router, type IRouter, type Request, type Response } from "express";
import { db, whatsappTransactions } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { sendWhatsAppMessage } from "../lib/twilio";

const CONFIRM_MESSAGE =
  "Votre demande a bien été prise en compte. L'argent sera disponible très bientôt. Merci de votre confiance 🙏";

const router: IRouter = Router();

router.get("/admin/transactions", async (req: Request, res: Response) => {
  const status = typeof req.query["status"] === "string"
    ? req.query["status"]
    : "pending";

  const rows = status === "all"
    ? await db
        .select()
        .from(whatsappTransactions)
        .orderBy(desc(whatsappTransactions.createdAt))
    : await db
        .select()
        .from(whatsappTransactions)
        .where(eq(whatsappTransactions.status, status))
        .orderBy(desc(whatsappTransactions.createdAt));

  res.json({ transactions: rows });
});

router.post(
  "/admin/transactions/:id/confirm",
  async (req: Request, res: Response) => {
    const id = Number(req.params["id"]);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [updated] = await db
      .update(whatsappTransactions)
      .set({ status: "confirmed", updatedAt: new Date() })
      .where(eq(whatsappTransactions.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    try {
      await sendWhatsAppMessage(updated.clientPhone, CONFIRM_MESSAGE);
    } catch (err) {
      req.log.error(
        { err, transactionId: updated.id, clientPhone: updated.clientPhone },
        "Failed to send WhatsApp confirmation message",
      );
      res.status(502).json({
        transaction: updated,
        error: "Transaction confirmée, mais échec de l'envoi du message WhatsApp.",
      });
      return;
    }

    res.json({ transaction: updated });
  },
);

router.post(
  "/admin/transactions/:id/cancel",
  async (req: Request, res: Response) => {
    const id = Number(req.params["id"]);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [updated] = await db
      .update(whatsappTransactions)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(whatsappTransactions.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json({ transaction: updated });
  },
);

export default router;
