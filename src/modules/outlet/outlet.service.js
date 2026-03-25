import prisma from "../../config/prisma.js";

export const getAllOutletsService = async () => {
  return prisma.outlet.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
    },
  });
};
