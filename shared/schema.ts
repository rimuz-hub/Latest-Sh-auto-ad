import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
export * from "./models/auth";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const configs = pgTable("configs", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  name: text("name").notNull().default("Default Config"),
  token: text("token").notNull(),
  message: text("message").notNull(),
  channelIds: text("channel_ids").notNull(), // Comma-separated string
  delaySeconds: integer("delay_seconds").notNull().default(60),
  imageUrls: text("image_urls"), // Comma-separated string
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConfigSchema = createInsertSchema(configs).omit({ 
  id: true, 
  createdAt: true 
});

export type Config = typeof configs.$inferSelect;
export type InsertConfig = z.infer<typeof insertConfigSchema>;

// API Types
export type StartRequest = {
  token: string;
  message: string;
  channelIds: string[]; // Sent as array for API
  delaySeconds: number;
  imageUrls?: string[];
};

export type LogEntry = {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error';
  message: string;
};

export type StatusResponse = {
  isRunning: boolean;
  logs: LogEntry[];
};
