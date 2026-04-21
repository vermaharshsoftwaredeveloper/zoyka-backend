import { z } from "zod";

export const createSettingSchema = z.object({
    category: z.string().trim().min(1, "Category is required"),
    key: z.string().trim().min(1, "Key is required"),
    value: z.string().trim().min(1, "Value is required"),
});

export const updateSettingSchema = z.object({
    category: z.string().trim().min(1).optional(),
    value: z.string().trim().min(1).optional(),
});