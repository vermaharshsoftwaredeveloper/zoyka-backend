import prisma from "../../config/prisma.js";
import { uploadImage, deleteImage } from "../../services/upload.service.js";

const saveBase64Image = async (base64String, folder = "bulk-inquiries") => {
  if (!base64String || !base64String.includes("base64,")) {
    return null;
  }
  try {
    return await uploadImage(base64String, folder, "inquiry");
  } catch {
    return null;
  }
};

export const createBulkOrderInquiryService = async (payload, userId) => {
  const dataToSave = { ...payload };

  // Handle reference image upload
  if (payload.referenceImage) {
    const imageUrl = await saveBase64Image(payload.referenceImage);
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
  const inquiry = await prisma.bulkOrderInquiry.findUnique({ where: { id }, select: { referenceImage: true } });
  const deleted = await prisma.bulkOrderInquiry.delete({
    where: { id },
  });
  // Clean up reference image from storage
  if (inquiry?.referenceImage) {
    await deleteImage(inquiry.referenceImage);
  }
  return deleted;
};
