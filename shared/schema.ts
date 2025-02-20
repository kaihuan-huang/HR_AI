import { pgTable, text, serial, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
  sequences: many(sequences)
}));

export const sequences = pgTable("sequences", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  name: text("name").notNull(),
  variables: json("variables").$type<Record<string, string>>(),
  createdAt: timestamp("created_at").defaultNow()
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  sequenceId: serial("sequence_id"),
  content: text("content").notNull(),
  richContent: json("rich_content").$type<{
    blocks: Array<{
      type: string;
      text: string;
      marks?: Array<{ type: string; attrs?: Record<string, any> }>;
    }>;
  }>(),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  sequence: one(sequences, {
    fields: [messages.sequenceId],
    references: [sequences.id],
  })
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSequenceSchema = createInsertSchema(sequences).pick({
  name: true,
  variables: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  richContent: true,
  role: true,
  sequenceId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Sequence = typeof sequences.$inferSelect;
export type Message = typeof messages.$inferSelect;