import { z } from "zod";

export const listAdminTestimonialsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createAdminTestimonialSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerImageUrl: z.string().trim().url().optional(),
  reviewText: z.string().trim().min(3).max(2000),
  rating: z.coerce.number().int().min(1).max(5),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateAdminTestimonialSchema = createAdminTestimonialSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });
