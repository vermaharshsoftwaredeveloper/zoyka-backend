import { z } from "zod";

const addressTypeSchema = z.enum(["HOME", "WORK", "OTHER"]);

export const createAddressSchema = z.object({
  type: addressTypeSchema.default("HOME"),
  isDefault: z.boolean().default(false),
  fullName: z.string().trim().min(2).max(120),
  phoneNumber: z.string().trim().min(10).max(15),
  line1: z.string().trim().min(3).max(250),
  line2: z.string().trim().max(250).optional(),
  landmark: z.string().trim().max(250).optional(),
  district: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
  pincode: z.string().trim().min(4).max(10),
});

export const updateAddressSchema = createAddressSchema.partial();
