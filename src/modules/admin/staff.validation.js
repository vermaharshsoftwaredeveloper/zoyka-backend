import { z } from "zod";

export const addManagerSchema = z.object({
    name: z.string().trim().min(2).max(100, "Name is too long"),
    email: z.string().trim().email("Invalid email format").toLowerCase(),
    mobile: z.string().trim().regex(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
});