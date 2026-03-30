import prisma from "../../config/prisma.js";

export const getAllCategoriesService = async () => {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isActive: true,
    },
  });
};
