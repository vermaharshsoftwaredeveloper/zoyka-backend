import { asyncHandler } from "../../utils/async-handler/index.js";
import * as authService from "./auth.service.js";
import ApiError from "../../utils/api-error/index.js";
import {
  loginSchema,
  resendOtpSchema,
  signupSchema,
  // verifyLoginSchema,
  verifySignupSchema,
  createStaffSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from "./auth.validation.js";

const parseBody = (schema, body) => {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid request body");
  }

  return parsed.data;
};

export const login = asyncHandler(async (req, res) => {
  const payload = parseBody(loginSchema, req.body);
  const response = await authService.loginService(payload);
  res.status(200).json(response);
});

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

// export const requestLoginOtp = asyncHandler(async (req, res) => {
//   const payload = parseBody(loginSchema, req.body);

//   const response = await authService.requestLoginOtpService(payload);

//   res.status(200).json(response);
// });

// export const verifyLoginOtp = asyncHandler(async (req, res) => {
//   const payload = parseBody(verifyLoginSchema, req.body);

//   const response = await authService.verifyLoginOtpService(payload);

//   res.status(200).json(response);
// });

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

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const response = await authService.refreshTokenService(refreshToken);
  res.status(200).json(response);
});

export const googleAuth = asyncHandler(async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) throw new ApiError(400, "Google access token is required");
  const response = await authService.googleAuthService({ accessToken });
  res.status(200).json(response);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const payload = parseBody(forgotPasswordSchema, req.body);
  const response = await authService.forgotPasswordService(payload);
  res.status(200).json(response);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const payload = parseBody(resetPasswordSchema, req.body);
  const response = await authService.resetPasswordService(payload);
  res.status(200).json(response);
});