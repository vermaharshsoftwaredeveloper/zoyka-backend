import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { couponLimiter } from "../../middleware/rate-limit.middleware.js";
import { listAvailableCoupons, validateCoupon } from "./coupon.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", listAvailableCoupons);
router.post("/validate", couponLimiter, validateCoupon);

export default router;
