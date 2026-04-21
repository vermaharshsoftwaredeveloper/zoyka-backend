import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import {
  createAdminCouponSchema,
  listAdminCouponsQuerySchema,
  updateAdminCouponSchema,
} from "./admin-coupon.validation.js";
import {
  createAdminCouponService,
  deleteAdminCouponService,
  getAdminCouponByIdService,
  listAdminCouponsService,
  updateAdminCouponService,
} from "./admin-coupon.service.js";

const parseQuery = (schema, query) => {
  const parsed = schema.safeParse(query);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid query params");
  }

  return parsed.data;
};

const parseBody = (schema, body) => {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid request body");
  }

  return parsed.data;
};

export const listAdminCoupons = asyncHandler(async (req, res) => {
  const query = parseQuery(listAdminCouponsQuerySchema, req.query);
  const response = await listAdminCouponsService({
    ...query,
    isActive: query.isActive === undefined ? undefined : query.isActive === "true",
  });

  res.status(200).json({
    message: "Admin coupons fetched successfully",
    ...response,
  });
});

export const getAdminCouponById = asyncHandler(async (req, res) => {
  const data = await getAdminCouponByIdService(req.params.couponId);

  res.status(200).json({
    message: "Admin coupon fetched successfully",
    data,
  });
});

export const createAdminCoupon = asyncHandler(async (req, res) => {
  const payload = parseBody(createAdminCouponSchema, req.body);
  const data = await createAdminCouponService(payload);

  res.status(201).json({
    message: "Coupon created successfully",
    data,
  });
});

export const updateAdminCoupon = asyncHandler(async (req, res) => {
  const payload = parseBody(updateAdminCouponSchema, req.body);
  const data = await updateAdminCouponService(req.params.couponId, payload);

  res.status(200).json({
    message: "Coupon updated successfully",
    data,
  });
});

export const deleteAdminCoupon = asyncHandler(async (req, res) => {
  const data = await deleteAdminCouponService(req.params.couponId);

  res.status(200).json({
    message: "Coupon deleted successfully",
    data,
  });
});
