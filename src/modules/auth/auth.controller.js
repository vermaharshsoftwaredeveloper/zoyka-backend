import { asyncHandler } from "../../utils/async-handler/index.js";
import * as authService from "./auth.service.js";
import ApiError from "../../utils/api-error/index.js";
import {
  loginSchema,
  resendOtpSchema,
  signupSchema,
  verifyLoginSchema,
  verifySignupSchema,
  createStaffSchema
} from "./auth.validation.js";

const parseBody = (schema, body) => {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid request body");
  }

  return parsed.data;
};

export const signup = asyncHandler(async (req, res) => {
  const payload = parseBody(signupSchema, req.body);

  const response = await authService.signupService(payload);

  res.status(200).json(response);
});

export const verifySignupOtp = asyncHandler(async (req, res) => {
  const payload = parseBody(verifySignupSchema, req.body);

  const response = await authService.verifySignupOtpService(payload);

  res.status(200).json(response);
});

export const requestLoginOtp = asyncHandler(async (req, res) => {
  const payload = parseBody(loginSchema, req.body);

  const response = await authService.requestLoginOtpService(payload);

  res.status(200).json(response);
});

export const verifyLoginOtp = asyncHandler(async (req, res) => {
  const payload = parseBody(verifyLoginSchema, req.body);

  const response = await authService.verifyLoginOtpService(payload);

  res.status(200).json(response);
});

export const resendOtp = asyncHandler(async (req, res) => {
  const payload = parseBody(resendOtpSchema, req.body);

  const response = await authService.resendOtpService(payload);

  res.status(200).json(response);
});

export const createStaff = asyncHandler(async (req, res) => {
  const payload = parseBody(createStaffSchema, req.body);
  const response = await authService.createStaffService(payload);
  res.status(201).json(response);
});