import { z } from "zod";

export const listAdminBannersQuerySchema = z.object({
  isActive: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createAdminBannerSchema = z.object({
  imageUrl: z.string().trim().url("imageUrl must be a valid URL"),
  link: z.string().trim().url("link must be a valid URL").optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateAdminBannerSchema = createAdminBannerSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });
