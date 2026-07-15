import { z } from "zod";

export const createMemorialSchema = z.object({
  firstName: z
    .string()
    .min(1, "Il nome è obbligatorio")
    .max(100, "Il nome non può superare 100 caratteri")
    .trim(),
  lastName: z
    .string()
    .min(1, "Il cognome è obbligatorio")
    .max(100, "Il cognome non può superare 100 caratteri")
    .trim(),
  nickname: z
    .string()
    .max(100, "Il soprannome non può superare 100 caratteri")
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  birthDate: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido (YYYY-MM-DD)")
      .optional()
  ),
  birthPlace: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.string().max(200).trim().optional()
  ),
  deathDate: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido (YYYY-MM-DD)")
      .optional()
  ),
  deathPlace: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.string().max(200).trim().optional()
  ),
  biography: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.string().max(10000, "La biografia non può superare 10000 caratteri").optional()
  ),
  visibility: z.enum(["public", "private", "invitation_only"]).default("public"),
  guardianRelationship: z
    .string()
    .min(1, "Indica il tuo legame con la persona")
    .max(100),
  guardianRelationshipDescription: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.string().max(500).optional()
  ),
});

export type CreateMemorialInput = z.infer<typeof createMemorialSchema>;

export const updateMemorialSchema = createMemorialSchema.partial().extend({
  id: z.string().uuid(),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Lo slug può contenere solo lettere minuscole, numeri e trattini"
    )
    .optional(),
  status: z
    .enum([
      "draft",
      "verification_pending",
      "active",
      "restricted",
      "disputed",
      "suspended",
      "archived",
      "deleted",
    ])
    .optional(),
  publicationMode: z
    .enum([
      "strict_review",
      "trusted_members_auto_publish",
      "open_with_post_moderation",
      "family_only",
    ])
    .optional(),
});

export type UpdateMemorialInput = z.infer<typeof updateMemorialSchema>;

export const memorialFilterSchema = z.object({
  query: z.string().max(200).optional(),
  visibility: z.enum(["public", "private", "invitation_only"]).optional(),
  status: z.enum(["active", "verification_pending", "archived"]).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["created_at", "updated_at", "last_name", "birth_date"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type MemorialFilterInput = z.infer<typeof memorialFilterSchema>;
