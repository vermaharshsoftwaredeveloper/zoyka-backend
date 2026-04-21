import { z } from "zod";

export const createHelpRequestSchema = z.object({
  referenceId: z.string().trim().min(3).max(120),
  additionalDetails: z.string().trim().min(5).max(2500),
});
