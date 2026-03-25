import { z } from "zod";

const otpPurposeEnum = z.enum(["SIGNUP", "LOGIN"]);

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  mobile: z.string().trim().min(10).max(15),
  password: z.string().min(8).max(128),
});

export const verifySignupSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: z.string().trim().length(6),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

export const verifyLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: z.string().trim().length(6),
});

export const resendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  purpose: otpPurposeEnum,
});

export const createStaffSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  mobile: z.string().trim().min(10).max(15),
  password: z.string().min(8).max(128),
  role: z.enum(["ADMIN", "MANAGER"], {
    required_error: "Role must be ADMIN or MANAGER",
  }),
});