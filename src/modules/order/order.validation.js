import { z } from "zod";

export const checkoutSchema = z.object({
  addressId: z.string().uuid(),
  paymentMethod: z.enum(["card", "upi"]).default("card"),
  notes: z.string().trim().max(500).optional(),
  couponCode: z.string().trim().max(30).optional(),
});

export const paymentConfirmSchema = z.object({
  paymentSessionId: z.string().uuid(),
});
