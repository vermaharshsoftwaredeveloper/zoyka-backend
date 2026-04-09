import prisma from "../../config/prisma.js";

export const createContactQueryService = async (payload, userId) => {
  return prisma.contactUsQuery.create({
    data: {
      ...payload,
      userId,
    },
  });
};
