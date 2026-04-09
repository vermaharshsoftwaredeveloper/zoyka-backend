import { z } from "zod";

export const createBulkOrderInquirySchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  companyName: z.string().trim().min(2).max(180),
  email: z.string().trim().toLowerCase().email(),
  phoneNumber: z.string().trim().min(10).max(15),
  quantityRequired: z.number().int().positive(),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
  pincode: z.string().trim().min(4).max(10),
  additionalDetails: z.string().trim().max(2000).optional(),
});
