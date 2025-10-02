import type { InferSelectModel } from "drizzle-orm";
import { pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type User = InferSelectModel<typeof users>;

// Simple ownership mapping for v0 chats
// The actual chat data lives in v0 API, we just track who owns what
export const chat_ownerships = pgTable(
  "chat_ownerships",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    v0_chat_id: varchar("v0_chat_id", { length: 255 }).notNull(), // v0 API chat ID
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // Ensure each v0 chat can only be owned by one user
    unique_v0_chat: unique().on(table.v0_chat_id),
  }),
);

export type ChatOwnership = InferSelectModel<typeof chat_ownerships>;

// Track anonymous chat creation by IP for rate limiting
export const anonymous_chat_logs = pgTable("anonymous_chat_logs", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  ip_address: varchar("ip_address", { length: 45 }).notNull(), // IPv6 can be up to 45 chars
  v0_chat_id: varchar("v0_chat_id", { length: 255 }).notNull(), // v0 API chat ID
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type AnonymousChatLog = InferSelectModel<typeof anonymous_chat_logs>;

// User preferences for AI provider and model
export const user_preferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  provider: varchar("provider", { length: 50 }).notNull().default("v0"), // v0, ollama, ollama-cloud, lmstudio, llama
  model_name: varchar("model_name", { length: 255 }), // e.g., llama3.2, gpt-4, etc.
  provider_config: varchar("provider_config", { length: 1000 }), // JSON string for provider-specific config
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type UserPreference = InferSelectModel<typeof user_preferences>;
