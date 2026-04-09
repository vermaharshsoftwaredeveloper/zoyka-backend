import { z } from "zod";

export const addManagerSchema = z.object({
    name: z.string().trim().min(2).max(100, "Name is too long"),
    email: z.string().trim().email("Invalid email format").toLowerCase(),
    mobile: z.string().trim().regex(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    location: z.string().trim().optional().nullable(),
    avatar: z.string().trim().url("Invalid image URL").optional().nullable(),
    outletId: z.string().uuid("Invalid Outlet ID").optional().nullable(),
    isActive: z.boolean().optional().default(true),
    joiningDate: z.string().datetime().optional().nullable(),
    bankAccountNo: z.string().trim().min(5).max(30).optional().nullable(),
    bankName: z.string().trim().max(100).optional().nullable(),
    bankIfscCode: z.string().trim().max(20).optional().nullable(),
});