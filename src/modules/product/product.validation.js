import { z } from "zod";

export const listProductsQuerySchema = z.object({
  outletKey: z.string().trim().optional(),
  district: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const bestsellerQuerySchema = z.object({
  outletKey: z.string().trim().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const topPicksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
