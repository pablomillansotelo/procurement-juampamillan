import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  keyHash: text("key_hash").notNull().unique(),
  name: text("name").notNull(),
  scopes: jsonb("scopes"),
  rateLimit: integer("rate_limit").default(100),
  expiresAt: timestamp("expires_at"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
  isActive: text("is_active").default("active"),
});


