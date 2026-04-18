import { z } from "zod";

export const addManagerSchema = z.object({
    name: z.string().trim().min(2).max(100, "Name is too long"),
    email: z.string().trim().email("Invalid email format").toLowerCase(),
    mobile: z.string().trim().regex(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    location: z.string().trim().optional().nullable(),
        avatar: z.preprocess((val) => {
            if (val === null || val === undefined) return val;
            if (typeof val === "string") return val;
            // If a File or object is provided (multipart/form-data via FormData), coerce to empty string
            return "";
        }, z.union([
            z.string().trim().url("Invalid image URL"),
            z.string().regex(/^data:image\/.+;base64,/, "Invalid image data"),
            z.literal("")
        ]).optional().nullable()),
    isActive: z.boolean().optional().default(true),
    joiningDate: z.string().optional().nullable(),
    bankAccountNo: z.string().trim().min(5).max(30).optional().nullable(),
    bankName: z.string().trim().max(100).optional().nullable(),
    bankIfscCode: z.string().trim().max(20).optional().nullable(),
});

// Update schema: allow partial updates but require at least one field
export const updateManagerSchema = addManagerSchema
    .partial()
    .refine((payload) => Object.keys(payload).length > 0, {
        message: "At least one field is required",
    });