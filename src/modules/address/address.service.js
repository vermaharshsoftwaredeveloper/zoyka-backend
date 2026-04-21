import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const ensureAddressOwnership = async ({ userId, addressId }) => {
  const address = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId,
    },
  });

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  return address;
};

export const listAddressesService = async (userId) => {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
};

export const createAddressService = async (userId, payload) => {
  // Optimize: Check if we need to update default addresses BEFORE transaction
  if (payload.isDefault) {
    // Update existing default addresses outside transaction for better performance
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  // Simple create operation without complex transaction
  return prisma.address.create({
    data: {
      userId,
      ...payload,
    },
  });
};

export const updateAddressService = async ({ userId, addressId, payload }) => {
  await ensureAddressOwnership({ userId, addressId });

  // Optimize: Update default addresses outside transaction if needed
  if (payload.isDefault) {
    await prisma.address.updateMany({
      where: { 
        userId, 
        isDefault: true,
        NOT: { id: addressId } // Don't update the address we're about to update
      },
      data: { isDefault: false },
    });
  }

  // Simple update operation
  return prisma.address.update({
    where: { id: addressId },
    data: payload,
  });
};

export const deleteAddressService = async ({ userId, addressId }) => {
  await ensureAddressOwnership({ userId, addressId });

  const activeOrdersCount = await prisma.order.count({
    where: {
      userId,
      addressId,
      status: {
        in: ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"],
      },
    },
  });

  if (activeOrdersCount > 0) {
    throw new ApiError(400, "Cannot delete address linked to active orders");
  }

  await prisma.address.delete({
    where: { id: addressId },
  });

  return { message: "Address deleted successfully" };
};
