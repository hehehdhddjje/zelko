import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getProductForConversation: vi.fn(),
  getConversationForParticipant: vi.fn(),
  getUserByUsername: vi.fn(),
}));

import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

function createAnonymousContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createAuthenticatedContext(userId = 7, username: string | null = "membre_zelko"): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: null,
      name: "Utilisateur de test",
      loginMethod: "oauth",
      username,
      bio: null,
      photoKey: null,
      photoUrl: null,
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("marketplace access control", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires an authenticated session before reading a private profile", async () => {
    const caller = appRouter.createCaller(createAnonymousContext());
    await expect(caller.marketplace.profile.me()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires an authenticated participant before sending a conversation message", async () => {
    const caller = appRouter.createCaller(createAnonymousContext());
    await expect(caller.marketplace.conversations.send({ conversationId: 1, body: "Bonjour" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("prevents a seller from opening a discussion on their own listing", async () => {
    vi.mocked(db.getProductForConversation).mockResolvedValue({ id: 21, sellerId: 7 });
    const caller = appRouter.createCaller(createAuthenticatedContext(7));
    await expect(caller.marketplace.conversations.open({ productId: 21 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("hides a conversation from a non-participant and prevents them from writing", async () => {
    vi.mocked(db.getConversationForParticipant).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createAuthenticatedContext(99));
    await expect(caller.marketplace.conversations.detail({ conversationId: 21 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.marketplace.conversations.send({ conversationId: 21, body: "Bonjour" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects a username already claimed by another member", async () => {
    vi.mocked(db.getUserByUsername).mockResolvedValue({ id: 8 });
    const caller = appRouter.createCaller(createAuthenticatedContext());
    await expect(caller.marketplace.profile.save({ username: "deja_pris", bio: "" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("validates the username format before persisting a profile", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    await expect(caller.marketplace.profile.save({ username: "ab", bio: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires a completed profile before publishing a product", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext(7, null));
    await expect(caller.marketplace.products.publish({
      name: "Lampe de table", description: "Une belle lampe en parfait état.", category: "Mobilier", priceCents: 2500, imageDataUrl: "invalid-image",
    })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("rejects invalid product pricing and invalid image formats", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    await expect(caller.marketplace.products.publish({
      name: "Lampe de table", description: "Une belle lampe en parfait état.", category: "Mobilier", priceCents: -1, imageDataUrl: "invalid-image",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.marketplace.products.publish({
      name: "Lampe de table", description: "Une belle lampe en parfait état.", category: "Mobilier", priceCents: 2500, imageDataUrl: "invalid-image",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires a completed profile and an existing listing before opening a discussion", async () => {
    const incompleteCaller = appRouter.createCaller(createAuthenticatedContext(7, null));
    await expect(incompleteCaller.marketplace.conversations.open({ productId: 21 })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    vi.mocked(db.getProductForConversation).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createAuthenticatedContext());
    await expect(caller.marketplace.conversations.open({ productId: 21 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
