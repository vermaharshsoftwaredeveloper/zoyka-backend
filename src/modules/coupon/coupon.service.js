import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

/**
 * List active, non-expired coupons visible to users.
 */
export const listAvailableCouponsService = async () => {
  const now = new Date();

  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      ],
    },
    select: {
      id: true,
      code: true,
      description: true,
      discountType: true,
      discountValue: true,
      minOrderAmount: true,
      maxDiscount: true,
      expiresAt: true,
      usageLimit: true,
      usedCount: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter out coupons that have exceeded their usage limit
  return coupons.filter(
    (c) => c.usageLimit == null || c.usedCount < c.usageLimit
  );
};

/**
 * Validate and calculate discount for a coupon code.
 */
export const validateCouponService = async ({ code, subtotal }) => {
  if (!code || typeof code !== "string") {
    throw new ApiError(400, "Coupon code is required");
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!coupon) {
    throw new ApiError(400, "Invalid or expired coupon code");
  }

  if (!coupon.isActive) {
    throw new ApiError(400, "Invalid or expired coupon code");
  }

  const now = new Date();

  if (coupon.startsAt && coupon.startsAt > now) {
    throw new ApiError(400, "Invalid or expired coupon code");
  }

  if (coupon.expiresAt && coupon.expiresAt <= now) {
    throw new ApiError(400, "Invalid or expired coupon code");
  }

  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, "Invalid or expired coupon code");
  }

  if (coupon.minOrderAmount != null && subtotal < coupon.minOrderAmount) {
    throw new ApiError(
      400,
      `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`
    );
  }

  // Calculate discount
  let discount = 0;

  if (coupon.discountType === "PERCENTAGE") {
    discount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount != null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else if (coupon.discountType === "FLAT") {
    discount = coupon.discountValue;
    // Don't let flat discount exceed subtotal
    discount = Math.min(discount, subtotal);
  }

  discount = Math.round(discount * 100) / 100;

  return {
    valid: true,
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discount,
    maxDiscount: coupon.maxDiscount,
    minOrderAmount: coupon.minOrderAmount,
  };
};

/**
 * Atomically increment the usedCount of a coupon (call after successful order placement).
 * Uses a conditional update to prevent race conditions (TOCTOU).
 */
export const incrementCouponUsage = async (tx, code) => {
  if (!code) return;

  const normalizedCode = code.trim().toUpperCase();

  // Atomic check-and-increment: only increment if under limit
  // This prevents the TOCTOU race condition where two concurrent checkouts
  // could both pass the validation but exceed the usage limit
  const coupon = await tx.coupon.findUnique({
    where: { code: normalizedCode },
    select: { usageLimit: true, usedCount: true },
  });

  if (!coupon) return;

  // If there's a usage limit, do a conditional update
  if (coupon.usageLimit != null) {
    const result = await tx.$executeRawUnsafe(
      `UPDATE "Coupon" SET "usedCount" = "usedCount" + 1 WHERE "code" = $1 AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")`,
      normalizedCode
    );

    if (result === 0) {
      throw new ApiError(400, "This coupon has reached its usage limit");
    }
  } else {
    await tx.coupon.update({
      where: { code: normalizedCode },
      data: { usedCount: { increment: 1 } },
    });
  }
};
