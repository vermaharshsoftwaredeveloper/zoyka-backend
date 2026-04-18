import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  avatar: z.string().trim().url().optional(),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number").optional(),
});
