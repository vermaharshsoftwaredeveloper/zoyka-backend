import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const outletSelect = {
  id: true,
  key: true,
  name: true,
  description: true,
  imageUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export const listAdminOutletsService = async ({ search, isActive, page, limit }) => {
  const where = {};

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  if (search) {
    where.OR = [
      { key: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.outlet.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: outletSelect,
    }),
    prisma.outlet.count({ where }),
  ]);

  return {
    data,
    page,
    limit,
    total,
  };
};

export const getAdminOutletByIdService = async (outletId) => {
  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId },
    select: outletSelect,
  });

  if (!outlet) {
    throw new ApiError(404, "Outlet not found");
  }

  return outlet;
};

export const createAdminOutletService = async (payload) => {
  try {
    return await prisma.outlet.create({
      data: payload,
      select: outletSelect,
    });
  } catch (error) {
    if (error?.code === "P2002") {
      throw new ApiError(409, "Outlet key already exists");
    }

    throw error;
  }
};

export const updateAdminOutletService = async (outletId, payload) => {
  await getAdminOutletByIdService(outletId);

  try {
    return await prisma.outlet.update({
      where: { id: outletId },
      data: payload,
      select: outletSelect,
    });
  } catch (error) {
    if (error?.code === "P2002") {
      throw new ApiError(409, "Outlet key already exists");
    }

    throw error;
  }
};

export const deleteAdminOutletService = async (outletId) => {
  await getAdminOutletByIdService(outletId);

  return prisma.outlet.update({
    where: { id: outletId },
    data: { isActive: false },
    select: outletSelect,
  });
};
