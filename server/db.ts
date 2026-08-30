import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  conversations,
  InsertUser,
  messages,
  products,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("La base de données est momentanément indisponible.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserProfileById(id: number) {
  const db = await requireDb();
  const result = await db.select({
    id: users.id,
    username: users.username,
    bio: users.bio,
    photoUrl: users.photoUrl,
    name: users.name,
    createdAt: users.createdAt,
  }).from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByUsername(username: string, excludeUserId?: number) {
  const db = await requireDb();
  const result = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  return result[0] && result[0].id !== excludeUserId ? result[0] : undefined;
}

export async function getPublicUserProfile(id: number) {
  const db = await requireDb();
  const result = await db.select({ id: users.id, username: users.username, name: users.name, photoUrl: users.photoUrl })
    .from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUserProfile(
  id: number,
  profile: { username: string; bio: string; photoKey?: string | null; photoUrl?: string | null },
) {
  const db = await requireDb();
  const values: Record<string, string | null> = { username: profile.username, bio: profile.bio };
  if (profile.photoKey !== undefined) values.photoKey = profile.photoKey;
  if (profile.photoUrl !== undefined) values.photoUrl = profile.photoUrl;
  await db.update(users).set(values).where(eq(users.id, id));
  return getUserProfileById(id);
}

const listingFields = {
  id: products.id,
  name: products.name,
  description: products.description,
  category: products.category,
  priceCents: products.priceCents,
  currency: products.currency,
  imageUrl: products.imageUrl,
  createdAt: products.createdAt,
  sellerId: users.id,
  sellerUsername: users.username,
  sellerPhotoUrl: users.photoUrl,
  sellerBio: users.bio,
};

export async function listPublishedProducts(filters?: { query?: string; category?: string }) {
  const db = await requireDb();
  const clauses = [];
  if (filters?.category) clauses.push(eq(products.category, filters.category));
  if (filters?.query) {
    const needle = `%${filters.query}%`;
    clauses.push(or(like(products.name, needle), like(products.description, needle)));
  }
  return db.select(listingFields).from(products).innerJoin(users, eq(products.sellerId, users.id))
    .where(clauses.length ? and(...clauses) : undefined).orderBy(desc(products.createdAt));
}

export async function listCategories() {
  const db = await requireDb();
  const result = await db.selectDistinct({ category: products.category }).from(products).orderBy(products.category);
  return result.map((row) => row.category);
}

export async function getProductById(id: number) {
  const db = await requireDb();
  const result = await db.select(listingFields).from(products).innerJoin(users, eq(products.sellerId, users.id))
    .where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function getProductForConversation(id: number) {
  const db = await requireDb();
  const result = await db.select({ id: products.id, sellerId: products.sellerId }).from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function listProductsBySeller(sellerId: number) {
  const db = await requireDb();
  return db.select().from(products).where(eq(products.sellerId, sellerId)).orderBy(desc(products.createdAt));
}

export async function createProduct(input: {
  sellerId: number; name: string; description: string; category: string; priceCents: number; imageKey: string; imageUrl: string;
}) {
  const db = await requireDb();
  const result = await db.insert(products).values(input);
  const id = Number(result[0].insertId);
  return getProductById(id);
}

export async function getOrCreateConversation(input: { productId: number; buyerId: number; sellerId: number }) {
  const db = await requireDb();
  await db.insert(conversations).values(input).onDuplicateKeyUpdate({ set: { updatedAt: sql`CURRENT_TIMESTAMP` } });
  const result = await db.select().from(conversations)
    .where(and(eq(conversations.productId, input.productId), eq(conversations.buyerId, input.buyerId))).limit(1);
  return result[0];
}

export async function getConversationForParticipant(conversationId: number, userId: number) {
  const db = await requireDb();
  const result = await db.select({
    id: conversations.id,
    productId: conversations.productId,
    buyerId: conversations.buyerId,
    sellerId: conversations.sellerId,
    productName: products.name,
    productImageUrl: products.imageUrl,
    updatedAt: conversations.updatedAt,
  }).from(conversations).innerJoin(products, eq(conversations.productId, products.id))
    .where(and(eq(conversations.id, conversationId), or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)))).limit(1);
  return result[0];
}

export async function listConversationsForUser(userId: number) {
  const db = await requireDb();
  const result = await db.select({
    id: conversations.id,
    productId: conversations.productId,
    buyerId: conversations.buyerId,
    sellerId: conversations.sellerId,
    productName: products.name,
    productImageUrl: products.imageUrl,
    updatedAt: conversations.updatedAt,
  }).from(conversations).innerJoin(products, eq(conversations.productId, products.id))
    .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId))).orderBy(desc(conversations.updatedAt));

  const counterpartIds = Array.from(new Set(result.map((item) => item.buyerId === userId ? item.sellerId : item.buyerId)));
  const people = counterpartIds.length ? await db.select({ id: users.id, username: users.username, photoUrl: users.photoUrl, name: users.name })
    .from(users).where(inArray(users.id, counterpartIds)) : [];
  const peopleById = new Map(people.map((person) => [person.id, person]));
  return result.map((item) => ({ ...item, counterpart: peopleById.get(item.buyerId === userId ? item.sellerId : item.buyerId) }));
}

export async function listMessages(conversationId: number) {
  const db = await requireDb();
  return db.select({ id: messages.id, body: messages.body, senderId: messages.senderId, createdAt: messages.createdAt })
    .from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}

export async function createMessage(input: { conversationId: number; senderId: number; body: string }) {
  const db = await requireDb();
  const result = await db.insert(messages).values(input);
  await db.update(conversations).set({ updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(conversations.id, input.conversationId));
  return { id: Number(result[0].insertId), ...input };
}
