import prisma from "../../config/prisma.js";

export const getAllOutletsService = async ({ regionId } = {}) => {
  const where = { isActive: true };
  if (regionId) where.regionId = regionId;

  return prisma.outlet.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      imageUrl: true,
      region: { select: { id: true, name: true } },
    },
  });
};
