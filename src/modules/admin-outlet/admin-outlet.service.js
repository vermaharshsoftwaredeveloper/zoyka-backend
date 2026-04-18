import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";
import fs from "fs";
import path from "path";
import { API_BASE_URL } from "../../config/env.js";

const outletSelect = {
  id: true,
  key: true,
  name: true,
  description: true,
  imageUrl: true,
  location: true,
  artisansCount: true,
  managerId: true,
  manager: { select: { id: true, name: true, email: true } },
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
  // process inline base64 image or external URL
  if (payload.image && typeof payload.image === "string") {
    if (payload.image.startsWith("data:image/")) {
      try {
        const matches = payload.image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (!matches) throw new ApiError(400, "Invalid image data");
        const mime = matches[1];
        const ext = mime.split("/")[1].split("+")[0];
        const data = matches[2];
        const buffer = Buffer.from(data, "base64");
        const filename = `outlet_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);
        payload.imageUrl = `${API_BASE_URL}/api/uploads/${filename}`;
        delete payload.image;
      } catch (err) {
        throw new ApiError(400, "Failed to process outlet image");
      }
    } else if (payload.image.trim()) {
      // assume external URL
      payload.imageUrl = payload.image;
      delete payload.image;
    } else {
      delete payload.image;
    }
  }

  // validate manager assignment if provided
  if (payload.managerId) {
    const manager = await prisma.user.findUnique({ where: { id: payload.managerId } });
    if (!manager) throw new ApiError(404, "Manager not found");
    if (manager.role !== "MANAGER") throw new ApiError(400, "User is not a manager");
    const existing = await prisma.outlet.findFirst({ where: { managerId: payload.managerId } });
    if (existing) throw new ApiError(409, "This manager is already assigned to another outlet");
  }

  try {
    const createData = {
      key: payload.key,
      name: payload.name,
      description: payload.description,
      imageUrl: payload.imageUrl || null,
      location: payload.location || null,
      artisansCount: payload.artisansCount ?? payload.artisansCount === 0 ? payload.artisansCount : undefined,
      isActive: payload.isActive ?? true,
      managerId: payload.managerId || null,
    };

    return await prisma.outlet.create({
      data: createData,
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
