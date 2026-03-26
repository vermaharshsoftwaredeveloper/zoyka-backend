import { z } from "zod";

const imageUrlsSchema = z.array(z.string().trim().url()).max(10);

export const listAdminProductsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  outletId: z.string().trim().min(1).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createAdminProductSchema = z.object({
  outletId: z.string().trim().min(1, "outletId is required"),
  title: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case"),
  description: z.string().trim().max(4000).optional(),
  producerName: z.string().trim().max(160).optional(),
  producerStory: z.string().trim().max(4000).optional(),
  district: z.string().trim().min(2).max(100),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0).default(0),
  images: imageUrlsSchema.default([]),
  isActive: z.boolean().default(true),
});

export const updateAdminProductSchema = createAdminProductSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });
