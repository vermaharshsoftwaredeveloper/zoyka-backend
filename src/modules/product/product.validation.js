import { z } from "zod";

export const listProductsQuerySchema = z.object({
  categorySlug: z.string().trim().optional(),
  district: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const departmentParamSchema = z.object({
  departmentId: z.string().uuid("Invalid Department ID format"),
});

export const outletParamSchema = z.object({
  outletId: z.string().uuid("Invalid Outlet ID format"),
});

export const bestsellerLimitSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const topPicksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});