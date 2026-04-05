import { z } from "zod";

export const getOutletsQuerySchema = z.object({
    regionId: z.string().uuid("Invalid Region ID").optional(),
});

export const createOutletSchema = z.object({
    key: z.string().trim().min(2).max(50),
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().optional().nullable(),
    regionId: z.string().uuid("Invalid Region ID").optional().nullable(),
    departmentId: z.string().uuid("Invalid Department ID").optional().nullable(),
    managerId: z.string().uuid("Invalid Manager ID").optional().nullable(),
    monthlyCapacity: z.number().int().nonnegative().optional().nullable(),
    qualityScore: z.number().min(0).max(100).optional().nullable(),
    address: z.string().optional().nullable(),
});

export const updateOutletSchema = z.object({
    key: z.string().trim().min(2).max(50).optional(),
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().optional().nullable(),
    regionId: z.string().uuid("Invalid Region ID").optional().nullable(),
    departmentId: z.string().uuid("Invalid Department ID").optional().nullable(),
    managerId: z.string().uuid("Invalid Manager ID").optional().nullable(),
    monthlyCapacity: z.number().int().nonnegative().optional().nullable(),
    qualityScore: z.number().min(0).max(100).optional().nullable(),
    address: z.string().optional().nullable(),
});