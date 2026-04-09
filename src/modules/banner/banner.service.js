import prisma from "../../config/prisma.js";

export const listActiveBannersService = async ({ limit }) => {
  return prisma.banner.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      imageUrl: true,
      link: true,
      sortOrder: true,
    },
  });
};
