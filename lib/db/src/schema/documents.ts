import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  department: text("department").notNull(),
  avatarInitials: text("avatar_initials").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  loginId: text("login_id").unique(),
  passwordHash: text("password_hash"),
  passwordSalt: text("password_salt"),
  companyNumber: text("company_number").default("0125.6910.0681"),
  role: text("role").default("Employé"),
  signatureImage: text("signature_image"),
});

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("draft"),
  senderId: integer("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  recipientId: integer("recipient_id").notNull(),
  recipientName: text("recipient_name").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  signedAt: timestamp("signed_at"),
  signatureData: text("signature_data"),
  signatureX: real("signature_x"),
  signatureY: real("signature_y"),
  fileType: text("file_type").notNull().default("PDF"),
  fileSize: text("file_size").notNull().default("0 KB"),
  category: text("category").notNull().default("Général"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
