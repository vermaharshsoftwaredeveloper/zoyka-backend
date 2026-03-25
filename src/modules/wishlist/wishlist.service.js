import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const ensureProductExists = async (productId) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true,
    },
    select: { id: true },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }
};

export const listWishlistService = async (userId) => {
  return prisma.wishlist.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          outlet: {
            select: {
              id: true,
              key: true,
              name: true,
            },
          },
          images: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const addToWishlistService = async ({ userId, productId }) => {
  await ensureProductExists(productId);

  return prisma.wishlist.upsert({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    update: {},
    create: {
      userId,
      productId,
    },
    include: {
      product: {
        include: {
          outlet: {
            select: {
              id: true,
              key: true,
              name: true,
            },
          },
          images: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
};

export const removeFromWishlistService = async ({ userId, productId }) => {
  await prisma.wishlist.deleteMany({
    where: {
      userId,
      productId,
    },
  });

  return {
    message: "Product removed from wishlist",
  };
};
