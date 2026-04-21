import { z } from "zod";

const imageSchema = z.string().trim().refine(
  (val) => val.startsWith("http://") || val.startsWith("https://") || val.startsWith("data:image/"),
  { message: "Must be a valid URL or data URL" }
);

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1200).optional(),
  wouldRecommend: z.boolean().default(true),
  images: z.array(imageSchema).max(6).default([]),
});
