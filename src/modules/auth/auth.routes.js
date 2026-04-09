import { Router } from "express";
import {
	// requestLoginOtp,
	login,
	resendOtp,
	signup,
	// verifyLoginOtp,
	verifySignupOtp,
	createStaff
} from "./auth.controller.js";
import { requireAuth, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/signup/verify-otp", verifySignupOtp);
// router.post("/login", requestLoginOtp);
// router.post("/login/verify-otp", verifyLoginOtp);
router.post("/resend-otp", resendOtp);
router.post("/create-staff", requireAuth, authorizeRoles('ADMIN'), createStaff);

export default router;
