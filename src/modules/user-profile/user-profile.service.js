import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

export const getMyProfileService = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      avatar: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

export const updateMyProfileService = async (userId, payload) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: payload,
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      avatar: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};
