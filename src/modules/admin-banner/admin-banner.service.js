import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";
import { uploadImage, replaceImage, deleteImage } from "../../services/upload.service.js";

const bannerSelect = {
  id: true,
  imageUrl: true,
  link: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export const listAdminBannersService = async ({ isActive, page, limit }) => {
  const where = {};

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  const [data, total] = await Promise.all([
    prisma.banner.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: bannerSelect,
    }),
    prisma.banner.count({ where }),
  ]);

  return { data, page, limit, total };
};

export const getAdminBannerByIdService = async (bannerId) => {
  const banner = await prisma.banner.findUnique({
    where: { id: bannerId },
    select: bannerSelect,
  });

  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }

  return banner;
};

export const createAdminBannerService = async (payload) => {
  // Process image (base64 or URL)
  if (payload.imageUrl && payload.imageUrl.startsWith("data:image/")) {
    payload.imageUrl = await uploadImage(payload.imageUrl, "banners", "banner");
  }

  return prisma.banner.create({
    data: payload,
    select: bannerSelect,
  });
};

export const updateAdminBannerService = async (bannerId, payload) => {
  const existing = await getAdminBannerByIdService(bannerId);

  // Process image on update (replace old)
  if (payload.imageUrl && payload.imageUrl.startsWith("data:image/")) {
    payload.imageUrl = await replaceImage(payload.imageUrl, existing.imageUrl, "banners", "banner");
  }

  return prisma.banner.update({
    where: { id: bannerId },
    data: payload,
    select: bannerSelect,
  });
};

export const deleteAdminBannerService = async (bannerId) => {
  const existing = await getAdminBannerByIdService(bannerId);

  const deleted = await prisma.banner.delete({
    where: { id: bannerId },
    select: bannerSelect,
  });

  // Clean up image from storage
  if (existing.imageUrl) {
    await deleteImage(existing.imageUrl);
  }

  return deleted;
};
