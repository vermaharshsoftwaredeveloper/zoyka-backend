import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const couponSelect = {
  id: true,
  code: true,
  description: true,
  discountType: true,
  discountValue: true,
  minOrderAmount: true,
  maxDiscount: true,
  startsAt: true,
  expiresAt: true,
  usageLimit: true,
  usedCount: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export const listAdminCouponsService = async ({ search, isActive, page, limit }) => {
  const where = {};

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: couponSelect,
    }),
    prisma.coupon.count({ where }),
  ]);

  return { data, page, limit, total };
};

export const getAdminCouponByIdService = async (couponId) => {
  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    select: couponSelect,
  });

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  return coupon;
};

export const createAdminCouponService = async (payload) => {
  try {
    return await prisma.coupon.create({
      data: payload,
      select: couponSelect,
    });
  } catch (error) {
    if (error?.code === "P2002") {
      throw new ApiError(409, "Coupon code already exists");
    }

    throw error;
  }
};

export const updateAdminCouponService = async (couponId, payload) => {
  await getAdminCouponByIdService(couponId);

  try {
    return await prisma.coupon.update({
      where: { id: couponId },
      data: payload,
      select: couponSelect,
    });
  } catch (error) {
    if (error?.code === "P2002") {
      throw new ApiError(409, "Coupon code already exists");
    }

    throw error;
  }
};

export const deleteAdminCouponService = async (couponId) => {
  await getAdminCouponByIdService(couponId);

  return prisma.coupon.delete({
    where: { id: couponId },
    select: couponSelect,
  });
};
