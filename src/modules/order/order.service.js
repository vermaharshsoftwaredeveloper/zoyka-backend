import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const ORDER_STATUS_TIMELINE = [
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const toOrderCard = (order) => {
  return {
    id: order.id,
    status: order.status,
    quantity: order.quantity,
    unitPrice: order.unitPrice,
    totalAmount: order.totalAmount,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    product: order.product,
    address: order.address,
    tracking: {
      currentStatus: order.status,
      availableStatuses: ORDER_STATUS_TIMELINE,
      lastUpdatedAt: order.updatedAt,
    },
  };
};

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

const getUserCartWithItems = async (userId) => {
  return prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              actualPrice: true, 
              sellingPrice: true,
              stock: true,
            },
          },
        },
      },
    },
  });
};

export const checkoutCartService = async ({ userId, addressId, notes }) => {
  await ensureAddressOwnership({ userId, addressId });

  const cart = await getUserCartWithItems(userId);

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  const outOfStockItem = cart.items.find((item) => item.quantity > item.product.stock);

  if (outOfStockItem) {
    throw new ApiError(400, `${outOfStockItem.product.title} has insufficient stock`);
  }

  const createdOrders = await prisma.$transaction(async (tx) => {
    const orders = [];

    for (const item of cart.items) {
      const order = await tx.order.create({
        data: {
          userId,
          addressId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.product.actualPrice,
          totalAmount: item.quantity * item.product.actualPrice,
          notes,
          status: "PLACED",
        },
        include: {
          product: {
            include: {
              images: {
                orderBy: { sortOrder: "asc" },
                take: 1,
              },
              outlet: {
                select: {
                  id: true,
                  key: true,
                  name: true,
                },
              },
            },
          },
          address: true,
        },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      orders.push(order);
    }

    await tx.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return orders;
  });

  return createdOrders.map(toOrderCard);
};

export const listOrdersService = async (userId) => {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
          outlet: {
            select: {
              id: true,
              key: true,
              name: true,
            },
          },
        },
      },
      address: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map(toOrderCard);
};

export const getOrderByIdService = async ({ userId, orderId }) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      product: {
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
          },
          outlet: {
            select: {
              id: true,
              key: true,
              name: true,
            },
          },
        },
      },
      address: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return toOrderCard(order);
};
