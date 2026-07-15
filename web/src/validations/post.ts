import { z } from "zod";

export const createPostSchema = z.object({
  memorialId: z.string().uuid("ID memoriale non valido"),
  title: z
    .string()
    .max(300, "Il titolo non può superare 300 caratteri")
    .trim()
    .optional(),
  content: z
    .string()
    .min(1, "Il contenuto è obbligatorio")
    .max(50000, "Il contenuto non può superare 50000 caratteri"),
  mediaIds: z.array(z.string().uuid()).max(20, "Massimo 20 media").optional(),
  status: z
    .enum(["draft", "pending_family_review"])
    .default("pending_family_review"),
  albumId: z.string().uuid().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().max(300).trim().optional(),
  content: z.string().max(50000).optional(),
  mediaIds: z.array(z.string().uuid()).max(20).optional(),
  status: z.enum(["draft", "pending_family_review"]).optional(),
  isPinned: z.boolean().optional(),
});

export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const createCommentSchema = z.object({
  postId: z.string().uuid(),
  content: z
    .string()
    .min(1, "Il commento non può essere vuoto")
    .max(5000, "Il commento non può superare 5000 caratteri"),
  parentId: z.string().uuid().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const createSupportMessageSchema = z.object({
  memorialId: z.string().uuid(),
  content: z
    .string()
    .min(1, "Il messaggio è obbligatorio")
    .max(2000, "Il messaggio non può superare 2000 caratteri"),
  reactionType: z
    .enum(["candle", "flower", "heart", "prayer", "memory", "gratitude"])
    .optional(),
  isAnonymous: z.boolean().default(false),
});

export type CreateSupportMessageInput = z.infer<typeof createSupportMessageSchema>;
