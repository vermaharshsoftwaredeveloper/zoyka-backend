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
              outlet: { select: { id: true, key: true, name: true } },
              images: { orderBy: { sortOrder: "asc" } },
            },
          },
          variant: { include: { images: { orderBy: { sortOrder: "asc" } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const subtotal = cart.items.reduce((sum, item) => {
    const unitPrice = item.variant ? item.variant.sellingPrice : item.product.sellingPrice;
    return sum + item.quantity * unitPrice;
  }, 0);

  return {
    ...cart,
    subtotal,
  };
};

export const addCartItemService = async ({ userId, productId, variantId, quantity }) => {
  const product = await ensureProductForCart(productId);

  // If a variant is specified, validate it and use variant stock
  let effectiveStock = product.stock;
  if (variantId) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId, isActive: true },
      select: { id: true, stock: true },
    });
    if (!variant) throw new ApiError(404, "Product variant not found");
    effectiveStock = variant.stock;
  }

  if (quantity > effectiveStock) {
    throw new ApiError(400, "Requested quantity exceeds available stock");
  }

  const cart = await ensureCart(userId);

  // Unique cart item key includes variantId (null === no variant)
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
      variantId: variantId ?? null,
    },
  });

  const cartItemInclude = {
    product: {
      include: {
        outlet: { select: { id: true, key: true, name: true } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    },
    variant: { include: { images: { orderBy: { sortOrder: "asc" } } } },
  };

  if (existingItem) {
    const updatedQuantity = existingItem.quantity + quantity;

    if (updatedQuantity > effectiveStock) {
      throw new ApiError(400, "Requested quantity exceeds available stock");
    }

    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: updatedQuantity },
      include: cartItemInclude,
    });
  }

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId,
      variantId: variantId ?? null,
      quantity,
    },
    include: cartItemInclude,
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
      product: { select: { id: true, stock: true } },
      variant: { select: { id: true, stock: true } },
    },
  });

  if (!item) {
    throw new ApiError(404, "Cart item not found");
  }

  const effectiveStock = item.variant ? item.variant.stock : item.product.stock;

  if (quantity > effectiveStock) {
    throw new ApiError(400, "Requested quantity exceeds available stock");
  }

  return prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
    include: {
      product: {
        include: {
          outlet: { select: { id: true, key: true, name: true } },
          images: { orderBy: { sortOrder: "asc" } },
        },
      },
      variant: { include: { images: { orderBy: { sortOrder: "asc" } } } },
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
