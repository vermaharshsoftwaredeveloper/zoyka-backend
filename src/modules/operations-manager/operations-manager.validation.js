import { z } from "zod";

const uuidSchema = z.string().uuid("Invalid UUID");

export const filteredOrdersQuerySchema = z.object({
  outletId: uuidSchema.optional(),
  status: z.enum([
    "PLACED", 
    "CONFIRMED", 
    "PACKED", 
    "SHIPPED", 
    "OUT_FOR_DELIVERY", 
    "DELIVERED", 
    "CANCELLED"
  ]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listScopeQuerySchema = z.object({
  outletId: uuidSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const dashboardQuerySchema = z.object({
  outletId: uuidSchema.optional(),
  lowStockThreshold: z.coerce.number().int().min(0).max(1000).default(10),
});

export const listLowStockQuerySchema = z.object({
  outletId: uuidSchema.optional(),
  threshold: z.coerce.number().int().min(0).max(1000).default(10),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const orderDecisionSchema = z.object({
  decision: z.enum(["ACCEPT", "REJECT"]),
  reason: z.string().trim().max(500).optional(),
});

export const qcDecisionSchema = z.object({
  decision: z.enum(["PASS", "FAIL"]),
  notes: z.string().trim().max(500).optional(),
});

export const dispatchOrderSchema = z.object({
  notes: z.string().trim().max(500).optional(),
  // trackingNumber here later
});

export const updateStockSchema = z.object({
  mode: z.enum(["SET", "INCREMENT"]).default("INCREMENT"),
  quantity: z.coerce.number().int().min(1),
});

const imageUrlsSchema = z.array(z.string().trim().url()).max(10);

export const createOutletProductSchema = z.object({
  outletId: uuidSchema.optional(),
  artisanId: uuidSchema,
  categoryId: uuidSchema,
  
  title: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case"),
  description: z.string().trim().max(4000).optional(),

  specialFeatures: z.string().trim().max(2000).optional(),
  material: z.string().trim().max(255).optional(),

  actualPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0).optional().default(0),

  images: imageUrlsSchema.default([]),
  isActive: z.boolean().default(true),
});

export const updateOutletProductSchema = z.object({
  outletId: uuidSchema.optional(),
  artisanId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),

  title: z.string().trim().min(2).max(160).optional(),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),

  description: z.string().trim().max(4000).optional(),
  specialFeatures: z.string().trim().max(2000).optional(),
  material: z.string().trim().max(255).optional(),

  actualPrice: z.coerce.number().min(0).optional(),
  sellingPrice: z.coerce.number().min(0).optional(),

  stock: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  images: imageUrlsSchema.optional(),
});

// export const updateOutletProductSchema = createOutletProductSchema
//   .partial()
//   .refine((payload) => Object.keys(payload).length > 0, {
//     message: "At least one field is required",
//   });
