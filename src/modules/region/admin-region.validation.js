import { z } from "zod";

export const getRegionsQuerySchema = z.object({
  departmentId: z.string().uuid("Invalid Department ID").optional(),
});

export const createRegionSchema = z.object({
  name: z.string().min(1),
  regionHead: z.string().trim().max(160).optional().nullable(),
  state: z.string().min(1),
  district: z.string().min(1),
  departmentId: z.string().uuid("Invalid Department ID"),
});

export const updateRegionSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  regionHead: z.string().trim().max(160).optional().nullable(),
  state: z.string().min(1).optional(),
  district: z.string().min(1).optional(),
  departmentId: z.string().uuid("Invalid Department ID").optional(),
});