import { z } from "zod";

export const createContactQuerySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(10).max(15),
  message: z.string().trim().min(5).max(2000),
});
