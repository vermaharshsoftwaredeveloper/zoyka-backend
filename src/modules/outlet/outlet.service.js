import prisma from "../../config/prisma.js";

export const getAllOutletsService = async ({ regionId, categoryId } = {}) => {
  const where = { isActive: true };
  if (regionId) where.regionId = regionId;
  if (categoryId) where.categoryId = categoryId;

  return prisma.outlet.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      imageUrl: true,
      location: true,
      categoryId: true,
      region: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  });
};
