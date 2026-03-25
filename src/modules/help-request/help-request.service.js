import prisma from "../../config/prisma.js";

export const createHelpRequestService = async (payload, userId) => {
  return prisma.paymentDeliveryHelpRequest.create({
    data: {
      ...payload,
      userId,
    },
  });
};
