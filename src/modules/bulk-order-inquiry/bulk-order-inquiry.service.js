import prisma from "../../config/prisma.js";
import path from "path";
import fs from "fs";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

const saveBase64Image = (base64String, folder = "bulk-inquiries") => {
  if (!base64String || !base64String.includes("base64,")) {
    return null;
  }

  try {
    const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }

    const ext = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, "base64");

    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    return `${API_BASE_URL}/api/uploads/${folder}/${filename}`;
  } catch (error) {
    console.error("Error saving image:", error);
    return null;
  }
};

export const createBulkOrderInquiryService = async (payload, userId) => {
  const dataToSave = { ...payload };

  // Handle reference image upload
  if (payload.referenceImage) {
    const imageUrl = saveBase64Image(payload.referenceImage);
    if (imageUrl) {
      dataToSave.referenceImage = imageUrl;
    } else {
      delete dataToSave.referenceImage;
    }
  }

  return prisma.bulkOrderInquiry.create({
    data: {
      ...dataToSave,
      userId,
    },
  });
};

export const getAllBulkOrderInquiriesService = async (filters = {}) => {
  const { outletId, status, page = 1, limit = 20 } = filters;
  
  const where = {};
  
  if (outletId) {
    where.outletId = outletId;
  }
  
  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;

  const [inquiries, total] = await Promise.all([
    prisma.bulkOrderInquiry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        outlet: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: parseInt(limit),
    }),
    prisma.bulkOrderInquiry.count({ where }),
  ]);

  return {
    data: inquiries,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getBulkOrderInquiryByIdService = async (id) => {
  return prisma.bulkOrderInquiry.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
        },
      },
      outlet: {
        select: {
          id: true,
          name: true,
          location: true,
          address: true,
        },
      },
    },
  });
};

export const updateBulkOrderInquiryService = async (id, payload) => {
  return prisma.bulkOrderInquiry.update({
    where: { id },
    data: payload,
  });
};

export const deleteBulkOrderInquiryService = async (id) => {
  return prisma.bulkOrderInquiry.delete({
    where: { id },
  });
};
