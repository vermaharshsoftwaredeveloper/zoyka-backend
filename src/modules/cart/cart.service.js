import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const ensureCart = async (userId) => {
  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  return cart;
};

const ensureProductForCart = async (productId) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true,
    },
    select: {
      id: true,
      stock: true,
    },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};

export const getCartService = async (userId) => {
  await ensureCart(userId);

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
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
      },
    },
  });

  const subtotal = cart.items.reduce((sum, item) => {
    return sum + item.quantity * item.product.price;
  }, 0);

  return {
    ...cart,
    subtotal,
  };
};

export const addCartItemService = async ({ userId, productId, quantity }) => {
  const product = await ensureProductForCart(productId);

  if (quantity > product.stock) {
    throw new ApiError(400, "Requested quantity exceeds available stock");
  }

  const cart = await ensureCart(userId);

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  if (existingItem) {
    const updatedQuantity = existingItem.quantity + quantity;

    if (updatedQuantity > product.stock) {
      throw new ApiError(400, "Requested quantity exceeds available stock");
    }

    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: updatedQuantity },
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
  }

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId,
      quantity,
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

export const updateCartItemService = async ({ userId, itemId, quantity }) => {
  const cart = await ensureCart(userId);

  const item = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cartId: cart.id,
    },
    include: {
      product: {
        select: {
          id: true,
          stock: true,
        },
      },
    },
  });

  if (!item) {
    throw new ApiError(404, "Cart item not found");
  }

  if (quantity > item.product.stock) {
    throw new ApiError(400, "Requested quantity exceeds available stock");
  }

  return prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
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

export const removeCartItemService = async ({ userId, itemId }) => {
  const cart = await ensureCart(userId);

  await prisma.cartItem.deleteMany({
    where: {
      id: itemId,
      cartId: cart.id,
    },
  });

  return { message: "Cart item removed successfully" };
};

export const clearCartService = async (userId) => {
  const cart = await ensureCart(userId);

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
    },
  });

  return { message: "Cart cleared successfully" };
};
