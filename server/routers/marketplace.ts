import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { storagePut } from "../storage";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const imageDataSchema = z.string().max(5_700_000, "L’image est trop volumineuse.");

function requireProfileComplete(user: { username: string | null }) {
  if (!user.username) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Complétez votre profil avant de poursuivre.",
    });
  }
}

function imageFromDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Utilisez une image PNG, JPEG ou WebP valide.",
    });
  }

  const bytes = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "L’image doit faire au maximum 4 Mo.",
    });
  }

  const extension = match[1] === "image/jpeg" ? "jpg" : match[1].split("/")[1];
  return { bytes, mimeType: match[1], extension };
}

async function uploadImage(dataUrl: string, folder: "profiles" | "listings", userId: number) {
  const image = imageFromDataUrl(dataUrl);
  return storagePut(`${folder}/${userId}/${Date.now()}.${image.extension}`, image.bytes, image.mimeType);
}

export const marketplaceRouter = router({
  catalog: publicProcedure
    .input(z.object({ query: z.string().trim().max(80).optional(), category: z.string().trim().max(60).optional() }).optional())
    .query(({ input }) => db.listPublishedProducts(input)),

  categories: publicProcedure.query(() => db.listCategories()),

  listing: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => db.getProductById(input.id)),

  profile: router({
    me: protectedProcedure.query(({ ctx }) => db.getUserProfileById(ctx.user.id)),

    save: protectedProcedure
      .input(z.object({
        username: z.string().trim().min(3, "Le nom d’utilisateur doit contenir au moins 3 caractères.").max(30).regex(/^[a-zA-Z0-9_-]+$/, "Utilisez uniquement des lettres, chiffres, tirets ou tirets bas."),
        bio: z.string().trim().max(500, "La biographie est limitée à 500 caractères.").optional(),
        photoDataUrl: imageDataSchema.nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const usernameTaken = await db.getUserByUsername(input.username, ctx.user.id);
        if (usernameTaken) {
          throw new TRPCError({ code: "CONFLICT", message: "Ce nom d’utilisateur est déjà utilisé." });
        }

        const photo = input.photoDataUrl === undefined
          ? undefined
          : input.photoDataUrl === null
            ? { key: null, url: null }
            : await uploadImage(input.photoDataUrl, "profiles", ctx.user.id);

        return db.updateUserProfile(ctx.user.id, {
          username: input.username,
          bio: input.bio ?? "",
          photoKey: photo?.key,
          photoUrl: photo?.url,
        });
      }),
  }),

  products: router({
    mine: protectedProcedure.query(({ ctx }) => db.listProductsBySeller(ctx.user.id)),

    publish: protectedProcedure
      .input(z.object({
        name: z.string().trim().min(3, "Le nom doit contenir au moins 3 caractères.").max(140),
        description: z.string().trim().min(10, "La description doit contenir au moins 10 caractères.").max(4_000),
        category: z.string().trim().min(2).max(60),
        priceCents: z.number().int().min(0).max(99_999_999),
        imageDataUrl: imageDataSchema,
      }))
      .mutation(async ({ ctx, input }) => {
        requireProfileComplete(ctx.user);
        const image = await uploadImage(input.imageDataUrl, "listings", ctx.user.id);
        return db.createProduct({
          sellerId: ctx.user.id,
          name: input.name,
          description: input.description,
          category: input.category,
          priceCents: input.priceCents,
          imageKey: image.key,
          imageUrl: image.url,
        });
      }),
  }),

  conversations: router({
    inbox: protectedProcedure.query(({ ctx }) => db.listConversationsForUser(ctx.user.id)),

    open: protectedProcedure
      .input(z.object({ productId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        requireProfileComplete(ctx.user);
        const product = await db.getProductForConversation(input.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Cette annonce n’existe plus." });
        if (product.sellerId === ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Vous ne pouvez pas vous contacter pour votre propre annonce." });
        }
        return db.getOrCreateConversation({ productId: product.id, buyerId: ctx.user.id, sellerId: product.sellerId });
      }),

    detail: protectedProcedure
      .input(z.object({ conversationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const conversation = await db.getConversationForParticipant(input.conversationId, ctx.user.id);
        if (!conversation) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation introuvable." });
        const messages = await db.listMessages(input.conversationId);
        const counterpartId = conversation.buyerId === ctx.user.id ? conversation.sellerId : conversation.buyerId;
        const counterpart = await db.getPublicUserProfile(counterpartId);
        return { conversation, counterpart, messages };
      }),

    send: protectedProcedure
      .input(z.object({ conversationId: z.number().int().positive(), body: z.string().trim().min(1).max(2_000) }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await db.getConversationForParticipant(input.conversationId, ctx.user.id);
        if (!conversation) throw new TRPCError({ code: "FORBIDDEN", message: "Vous ne pouvez pas écrire dans cette conversation." });
        return db.createMessage({ conversationId: input.conversationId, senderId: ctx.user.id, body: input.body });
      }),
  }),
});
