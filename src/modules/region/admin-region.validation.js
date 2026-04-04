import { z } from "zod";

export const getRegionsQuerySchema = z.object({
    categoryId: z.string().uuid("Invalid Category ID").optional(),
});

export const createRegionSchema = z.object({
  name: z.string().min(1),
  managerId: z.string().uuid().optional(),
  state: z.string().min(1),
  district: z.string().min(1),
});

export const updateRegionSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  managerId: z.string().uuid("Invalid Manager ID").optional().nullable(),
  categoryId: z.string().uuid("Invalid Category ID").optional().nullable(),
  state: z.string().min(1).optional(),
  district: z.string().min(1).optional(),
});