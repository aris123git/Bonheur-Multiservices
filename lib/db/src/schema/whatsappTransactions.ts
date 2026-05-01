import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const whatsappTransactions = pgTable("whatsapp_transactions", {
  id: serial("id").primaryKey(),
  clientPhone: text("client_phone").notNull(),
  type: text("type").notNull().default("dépôt"),
  amount: text("amount").notNull(),
  oneXBetId: text("one_x_bet_id").notNull(),
  operator: text("operator").notNull(),
  operatorPhone: text("operator_phone").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type WhatsappTransaction = typeof whatsappTransactions.$inferSelect;
export type InsertWhatsappTransaction =
  typeof whatsappTransactions.$inferInsert;
