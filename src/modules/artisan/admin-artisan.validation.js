import { z } from "zod";

export const getArtisansQuerySchema = z.object({
    categoryId: z.string().uuid("Invalid Category ID").optional(),
});

export const createArtisanSchema = z.object({
    outletName: z.string().trim().min(2, "Outlet name required"),
    artisanName: z.string().trim().min(2, "Artisan name required"),
    mobile: z.string().trim().min(10, "Valid mobile required"),
    email: z.string().email("Valid email required"),
    address: z.string().trim().optional().nullable(),
    monthlyCapacity: z.number().int().nonnegative().optional().nullable(),
    categoryId: z.string().uuid("Invalid Category ID").optional().nullable(),
    regionId: z.string().uuid("Invalid Region ID").optional().nullable(),
});

export const updateArtisanSchema = z.object({
    outletName: z.string().trim().min(2).optional(),
    address: z.string().trim().optional().nullable(),
    monthlyCapacity: z.number().int().nonnegative().optional().nullable(),
    categoryId: z.string().uuid("Invalid Category ID").optional().nullable(),
    regionId: z.string().uuid("Invalid Region ID").optional().nullable(),
    isActive: z.boolean().optional(),
});