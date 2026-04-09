import { z } from "zod";

export const createDepartmentSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    slug: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().optional().nullable(),
});

export const updateDepartmentSchema = z.object({
    name: z.string().trim().min(2).max(100).optional(),
    slug: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().optional().nullable(),
});