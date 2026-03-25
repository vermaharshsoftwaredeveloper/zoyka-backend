import { z } from "zod";

export const checkoutSchema = z.object({
  addressId: z.string().uuid(),
  notes: z.string().trim().max(500).optional(),
});
