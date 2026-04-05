import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const userProfileSelect = {
  id: true,
  name: true,
  email: true,
  mobile: true,
  avatar: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  managedOutlet: {
    select: {
      id: true,
      key: true,
      name: true,
      address: true,
      isActive: true,
      region: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } }
    }
  }
};

export const getMyProfileService = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userProfileSelect,
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
    select: userProfileSelect,
  });

  return user;
};