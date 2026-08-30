import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  username: varchar("username", { length: 30 }).unique(),
  bio: text("bio"),
  photoKey: varchar("photoKey", { length: 512 }),
  photoUrl: varchar("photoUrl", { length: 1024 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 140 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 60 }).notNull(),
  priceCents: int("priceCents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  imageKey: varchar("imageKey", { length: 512 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 1024 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("products_seller_idx").on(table.sellerId),
  index("products_category_idx").on(table.category),
  index("products_created_idx").on(table.createdAt),
]);

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  buyerId: int("buyerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: int("sellerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("conversations_product_buyer_unique").on(table.productId, table.buyerId),
  index("conversations_buyer_idx").on(table.buyerId),
  index("conversations_seller_idx").on(table.sellerId),
]);

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: int("senderId").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("messages_conversation_created_idx").on(table.conversationId, table.createdAt),
]);

export type Product = typeof products.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
