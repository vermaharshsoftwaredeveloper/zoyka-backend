import { z } from "zod";

const discountTypeSchema = z.enum(["PERCENTAGE", "FLAT"]);

const couponDateSchema = z
  .string()
  .datetime({ message: "Date must be a valid ISO datetime" })
  .transform((value) => new Date(value));

const couponBaseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[A-Z0-9_-]+$/, "code must be uppercase letters/numbers/_/-"),
  description: z.string().trim().max(1000).optional(),
  discountType: discountTypeSchema,
  discountValue: z.coerce.number().positive(),
  minOrderAmount: z.coerce.number().nonnegative().optional(),
  maxDiscount: z.coerce.number().positive().optional(),
  startsAt: couponDateSchema.optional(),
  expiresAt: couponDateSchema.optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

export const listAdminCouponsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createAdminCouponSchema = couponBaseSchema
  .refine((payload) => !payload.startsAt || !payload.expiresAt || payload.expiresAt > payload.startsAt, {
    message: "expiresAt must be greater than startsAt",
    path: ["expiresAt"],
  })
  .refine(
    (payload) => payload.discountType !== "PERCENTAGE" || payload.discountValue <= 100,
    {
      message: "Percentage discount cannot be greater than 100",
      path: ["discountValue"],
    }
  );

export const updateAdminCouponSchema = couponBaseSchema
  .extend({
    usedCount: z.coerce.number().int().nonnegative().optional(),
  })
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  })
  .refine((payload) => !payload.startsAt || !payload.expiresAt || payload.expiresAt > payload.startsAt, {
    message: "expiresAt must be greater than startsAt",
    path: ["expiresAt"],
  })
  .refine(
    (payload) =>
      payload.discountType !== "PERCENTAGE" || payload.discountValue === undefined || payload.discountValue <= 100,
    {
      message: "Percentage discount cannot be greater than 100",
      path: ["discountValue"],
    }
  );
