import { z } from "zod";

export const createBulkOrderInquirySchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  companyName: z.string().trim().min(2).max(180),
  email: z.string().trim().toLowerCase().email(),
  phoneNumber: z.string().trim().min(10).max(15),
  category: z.string().trim().optional(),
  quantityRequired: z.string().trim().min(1).max(100),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
  pincode: z.string().trim().min(4).max(10),
  outletId: z.string().uuid().optional(),
  additionalDetails: z.string().trim().max(2000).optional(),
  referenceImage: z.string().optional(),
});

export const updateBulkOrderInquirySchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "CONTACTED", "COMPLETED", "REJECTED"]).optional(),
  adminNotes: z.string().trim().max(2000).optional(),
});
