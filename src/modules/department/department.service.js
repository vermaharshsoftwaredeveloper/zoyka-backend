// src/modules/department/department.service.js

import prisma from "../../config/prisma.js";

export const getAllDepartmentsService = async () => {
  return prisma.department.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
    },
    orderBy: { name: "asc" },
  });
};