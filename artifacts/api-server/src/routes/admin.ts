import { Router, type IRouter, type Request, type Response } from "express";
import { db, whatsappTransactions } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/admin/transactions", async (req: Request, res: Response) => {
  const status = typeof req.query["status"] === "string"
    ? req.query["status"]
    : "pending";

  const rows = await db
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
