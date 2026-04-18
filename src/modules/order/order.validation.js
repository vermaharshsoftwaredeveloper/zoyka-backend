import { z } from "zod";

export const checkoutSchema = z.object({
  addressId: z.string().uuid(),
  paymentMethod: z.enum(["cod", "card", "upi"]).default("cod"),
  notes: z.string().trim().max(500).optional(),
});

export const paymentConfirmSchema = z.object({
  paymentSessionId: z.string().uuid(),
});
