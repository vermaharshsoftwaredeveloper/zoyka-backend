import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1200).optional(),
  wouldRecommend: z.boolean().default(true),
  images: z.array(z.string().trim().url()).max(6).default([]),
});
