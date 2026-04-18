import { asyncHandler } from "../../utils/async-handler/index.js";
import {
  listAvailableCouponsService,
  validateCouponService,
} from "./coupon.service.js";

export const listAvailableCoupons = asyncHandler(async (req, res) => {
  const data = await listAvailableCouponsService();

  res.status(200).json({
    message: "Available coupons fetched",
    data,
  });
});

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;

  const result = await validateCouponService({
    code,
    subtotal: Number(subtotal) || 0,
  });

  res.status(200).json({
    message: "Coupon is valid",
    data: result,
  });
});
