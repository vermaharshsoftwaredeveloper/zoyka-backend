import { z } from "zod";

export const listAdminOutletsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createAdminOutletSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "key must be lowercase kebab-case"),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).optional(),
  imageUrl: z.string().trim().url().optional(),
  isActive: z.boolean().default(true),
});

export const updateAdminOutletSchema = createAdminOutletSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });
