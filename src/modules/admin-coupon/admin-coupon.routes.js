import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.middleware.js";
import {
  createAdminCoupon,
  deleteAdminCoupon,
  getAdminCouponById,
  listAdminCoupons,
  updateAdminCoupon,
} from "./admin-coupon.controller.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/", listAdminCoupons);
router.get("/:couponId", getAdminCouponById);
router.post("/", createAdminCoupon);
router.patch("/:couponId", updateAdminCoupon);
router.delete("/:couponId", deleteAdminCoupon);

export default router;
