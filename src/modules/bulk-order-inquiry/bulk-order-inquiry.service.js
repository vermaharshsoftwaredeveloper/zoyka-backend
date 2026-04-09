import prisma from "../../config/prisma.js";

export const createBulkOrderInquiryService = async (payload, userId) => {
  return prisma.bulkOrderInquiry.create({
    data: {
      ...payload,
      userId,
    },
  });
};
