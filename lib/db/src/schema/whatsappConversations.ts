import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const whatsappConversations = pgTable("whatsapp_conversations", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull().unique(),
  profileName: text("profile_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type WhatsappConversation = typeof whatsappConversations.$inferSelect;
export type InsertWhatsappConversation =
  typeof whatsappConversations.$inferInsert;
