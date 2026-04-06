import { z } from "zod";

export const getArtisansQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  regionId: z.string().uuid().optional(),
  outletId: z.string().uuid().optional(),
});

export const createArtisanSchema = z.object({
  outletId: z.string().uuid("Outlet required"),
  avatar: z.string().trim().url().optional(),
  artisanName: z.string().trim().min(2, "Artisan name required"),
  mobile: z.string().trim().min(10, "Valid mobile required"),
  email: z.string().email("Valid email required"),
  address: z.string().trim().optional().nullable(),
  monthlyCapacity: z.number().int().nonnegative().optional().nullable(),
  categoryId: z.string().uuid("Invalid Category ID").optional().nullable(),
  regionId: z.string().uuid("Invalid Region ID").optional().nullable(),
  yearsOfExperience: z.number().optional(),
});

export const updateArtisanSchema = z.object({
  outletName: z.string().trim().min(2).optional(),
  avatar: z.string().trim().url().optional(),
  address: z.string().trim().optional().nullable(),
  monthlyCapacity: z.number().int().nonnegative().optional().nullable(),
  categoryId: z.string().uuid("Invalid Category ID").optional().nullable(),
  regionId: z.string().uuid("Invalid Region ID").optional().nullable(),
  isActive: z.boolean().optional(),
});