import { z } from "zod";

export const getArtisansQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  regionId: z.string().uuid().optional(),
  outletId: z.string().uuid().optional(),
});

export const createArtisanSchema = z.object({
  outletId: z.string().uuid("Invalid Outlet ID").optional(),
  outletName: z.string().trim().min(2, "Outlet/Store name required").optional(),
  avatar: z.preprocess((val) => {
    if (val === null || val === undefined) return val;
    if (typeof val === "string") return val;
    return "";
  }, z.union([
    z.string().trim().url("Invalid image URL"),
    z.string().regex(/^data:image\/.+;base64,/, "Invalid image data"),
  ]).optional()),
  artisanName: z.string().trim().min(2, "Artisan name required"),
  mobile: z.string().trim().min(10, "Valid mobile required"),
  email: z.string().email("Valid email required"),
  address: z.string().trim().optional().nullable(),
  monthlyCapacity: z.number().int().nonnegative().optional().nullable(),
  categoryId: z.string().uuid("Invalid Category ID").optional().nullable(),
  regionId: z.string().uuid("Invalid Region ID").optional().nullable(),
  yearsOfExperience: z.number().optional(),
}).refine((data) => data.outletId || data.outletName, {
  message: "Outlet ID or name is required",
});

export const updateArtisanSchema = z.object({
  outletId: z.string().uuid("Invalid Outlet ID").optional(),
  outletName: z.string().trim().min(2).optional(),
  avatar: z.preprocess((val) => {
    if (val === null || val === undefined) return val;
    if (typeof val === "string") return val;
    return "";
  }, z.union([
    z.string().trim().url("Invalid image URL"),
    z.string().regex(/^data:image\/.+;base64,/, "Invalid image data"),
  ]).optional()),
  address: z.string().trim().optional().nullable(),
  monthlyCapacity: z.number().int().nonnegative().optional().nullable(),
  categoryId: z.string().uuid("Invalid Category ID").optional().nullable(),
  regionId: z.string().uuid("Invalid Region ID").optional().nullable(),
  artisanName: z.string().trim().min(2).optional(),
  mobile: z.string().trim().min(10, "Valid mobile required").optional(),
  email: z.string().email("Valid email required").optional(),
  yearsOfExperience: z.number().optional(),
  isActive: z.boolean().optional(),
});