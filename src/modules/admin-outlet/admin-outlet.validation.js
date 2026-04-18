import { z } from "zod";

export const listAdminOutletsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createAdminOutletSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "key must be lowercase kebab-case"),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).optional(),
  imageUrl: z.string().trim().url().optional(),
  // Accept inline image data (data URL), external URL, empty, or File objects (FormData)
  image: z.preprocess((val) => {
    if (val === null || val === undefined) return val;
    if (typeof val === "string") return val;
    // If a File or object is provided (multipart/form-data via FormData), coerce to empty string
    return "";
  },
  z
    .union([
      z.string().trim().url("Invalid image URL"),
      z.string().regex(/^data:image\/.+;base64,/, "Invalid image data"),
      z.literal(""),
    ])
    .optional()
    .nullable()),
  location: z.string().trim().optional().nullable(),
  managerId: z.string().uuid("Invalid manager ID").optional().nullable(),
  artisansCount: z.coerce.number().int().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateAdminOutletSchema = createAdminOutletSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });
