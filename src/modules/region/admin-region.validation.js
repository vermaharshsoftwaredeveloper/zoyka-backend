import { z } from "zod";

export const getRegionsQuerySchema = z.object({
    categoryId: z.string().uuid("Invalid Category ID").optional(),
});

export const createRegionSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    managerId: z.string().uuid("Invalid Manager ID").optional().nullable(),
    categoryId: z.string().uuid("Invalid Category ID").optional().nullable(),
});

export const updateRegionSchema = z.object({
    name: z.string().trim().min(2).max(100).optional(),
    managerId: z.string().uuid("Invalid Manager ID").optional().nullable(),
    categoryId: z.string().uuid("Invalid Category ID").optional().nullable(),
});