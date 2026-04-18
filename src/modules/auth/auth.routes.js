import { Router } from "express";
import {
	// requestLoginOtp,
	login,
	resendOtp,
	signup,
	// verifyLoginOtp,
	verifySignupOtp,
	createStaff,
	refreshToken,
	googleAuth,
	forgotPassword,
	resetPassword
} from "./auth.controller.js";
import { requireAuth, authorizeRoles } from "../../middleware/auth.middleware.js";
import { authLimiter, otpLimiter } from "../../middleware/rate-limit.middleware.js";

const router = Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/refresh", authLimiter, refreshToken);
router.post("/signup/verify-otp", authLimiter, verifySignupOtp);
// router.post("/login", requestLoginOtp);
// router.post("/login/verify-otp", verifyLoginOtp);
router.post("/resend-otp", otpLimiter, resendOtp);
router.post("/google", authLimiter, googleAuth);
router.post("/create-staff", requireAuth, authorizeRoles('ADMIN'), createStaff);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

export default router;
