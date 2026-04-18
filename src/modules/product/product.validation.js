import { z } from "zod";

export const listProductsQuerySchema = z.object({
  categorySlug: z.string().trim().optional(),
  departmentId: z.string().uuid().optional(),
  district: z.string().trim().optional(),
  search: z.string().trim().optional(),
  regionId: z.string().uuid().optional(),
  outletId: z.string().uuid().optional(),
  material: z.union([z.string(), z.array(z.string())]).optional().transform((val) =>
    val ? (Array.isArray(val) ? val : val.split(",").map((s) => s.trim())) : undefined
  ),
  use: z.union([z.string(), z.array(z.string())]).optional().transform((val) =>
    val ? (Array.isArray(val) ? val : val.split(",").map((s) => s.trim())) : undefined
  ),
  special: z.union([z.string(), z.array(z.string())]).optional().transform((val) =>
    val ? (Array.isArray(val) ? val : val.split(",").map((s) => s.trim())) : undefined
  ),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  sortBy: z.enum(["price_asc", "price_desc", "newest", "rating", "popularity"]).optional(),
});

export const filterOptionsQuerySchema = z.object({
  departmentId: z.string().uuid().optional(),
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