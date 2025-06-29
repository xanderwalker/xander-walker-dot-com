import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const kaleidoscopeSubmissions = pgTable("kaleidoscope_submissions", {
  id: serial("id").primaryKey(),
  imageData: text("image_data").notNull(), // Base64 encoded image
  flowerCount: integer("flower_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertKaleidoscopeSubmissionSchema = createInsertSchema(kaleidoscopeSubmissions).pick({
  imageData: true,
  flowerCount: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type KaleidoscopeSubmission = typeof kaleidoscopeSubmissions.$inferSelect;
export type InsertKaleidoscopeSubmission = z.infer<typeof insertKaleidoscopeSubmissionSchema>;
