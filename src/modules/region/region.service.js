import prisma from "../../config/prisma.js";

export const getAllRegionsService = async ({ departmentId } = {}) => {
  const where = {
    isActive: true,
  };

  if (departmentId) {
    where.departmentId = departmentId;
  }

  return await prisma.region.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      state: true,
      district: true,
      regionHead: true,
      department: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
};
