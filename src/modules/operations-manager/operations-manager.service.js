import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const PRODUCT_INCLUDE = {
  outlet: {
    select: {
      id: true,
      key: true,
      name: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  images: {
    orderBy: { sortOrder: "asc" },
  },
};

const ORDER_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
    },
  },
  address: true,
  product: {
    include: PRODUCT_INCLUDE,
  },
};

const ORDER_STATUS = {
  NEW: "PLACED",
  QC_PENDING: "CONFIRMED",
  READY_TO_DISPATCH: "PACKED",
  SHIPPED: "SHIPPED",
  RETURN_PENDING: "CANCELLED",
};

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
    user: order.user,
    product: order.product,
    address: order.address,
  };
};

const getTodayBounds = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const appendContextNote = (existing, label, value) => {
  if (!value) {
    return existing;
  }

  const suffix = `[${label}: ${value}]`;
  return existing ? `${existing} ${suffix}` : suffix;
};

const ensureCategoryExists = async (categoryId) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }
};

const getManagedOutletIds = async ({ userId, role, outletId }) => {
  if (role === "ADMIN") {
    if (outletId) {
      const outlet = await prisma.outlet.findUnique({ where: { id: outletId }, select: { id: true } });

      if (!outlet) {
        throw new ApiError(404, "Outlet not found");
      }

      return [outletId];
    }

    const outlets = await prisma.outlet.findMany({ select: { id: true } });
    return outlets.map((outlet) => outlet.id);
  }

  const managedOutlets = await prisma.outlet.findMany({
    where: {
      OR: [{ region: { managerId: userId } }, { ownerId: userId }],
    },
    select: { id: true },
  });

  const managedOutletIds = managedOutlets.map((outlet) => outlet.id);

  if (!managedOutletIds.length) {
    throw new ApiError(403, "No managed outlets assigned to this manager");
  }

  if (outletId && !managedOutletIds.includes(outletId)) {
    throw new ApiError(403, "Outlet is outside your management scope");
  }

  return outletId ? [outletId] : managedOutletIds;
};

const buildOutletOrderWhere = (outletIds, extra = {}) => ({
  ...extra,
  product: {
    outletId: {
      in: outletIds,
    },
  },
});

const buildOutletProductWhere = (outletIds, extra = {}) => ({
  ...extra,
  outletId: {
    in: outletIds,
  },
});

const getScopedOrderOrThrow = async ({ orderId, outletIds }) => {
  const order = await prisma.order.findFirst({
    where: buildOutletOrderWhere(outletIds, { id: orderId }),
    include: ORDER_INCLUDE,
  });

  if (!order) {
    throw new ApiError(404, "Order not found in managed outlets");
  }

  return order;
};

const getScopedProductOrThrow = async ({ productId, outletIds }) => {
  const product = await prisma.product.findFirst({
    where: buildOutletProductWhere(outletIds, { id: productId }),
    include: PRODUCT_INCLUDE,
  });

  if (!product) {
    throw new ApiError(404, "Product not found in managed outlets");
  }

  return product;
};

export const getOpsDashboardService = async ({ user, outletId, lowStockThreshold }) => {
  const outletIds = await getManagedOutletIds({ userId: user.id, role: user.role, outletId });
  const { start, end } = getTodayBounds();

  const [
    ordersToday,
    pendingOrders,
    qcPending,
    readyToDispatch,
    lowStockAlerts,
    returnsPending,
  ] = await Promise.all([
    prisma.order.count({
      where: buildOutletOrderWhere(outletIds, {
        createdAt: { gte: start, lte: end },
      }),
    }),
    prisma.order.count({ where: buildOutletOrderWhere(outletIds, { status: ORDER_STATUS.NEW }) }),
    prisma.order.count({ where: buildOutletOrderWhere(outletIds, { status: ORDER_STATUS.QC_PENDING }) }),
    prisma.order.count({ where: buildOutletOrderWhere(outletIds, { status: ORDER_STATUS.READY_TO_DISPATCH }) }),
    prisma.product.count({
      where: buildOutletProductWhere(outletIds, {
        isActive: true,
        stock: { lte: lowStockThreshold },
      }),
    }),
    prisma.order.count({ where: buildOutletOrderWhere(outletIds, { status: ORDER_STATUS.RETURN_PENDING }) }),
  ]);

  return {
    ordersToday,
    pendingOrders,
    qcPending,
    readyToDispatch,
    lowStockAlerts,
    returnsPending,
  };
};

export const listNewOrdersService = async ({ user, outletId, page, limit }) => {
  const outletIds = await getManagedOutletIds({ userId: user.id, role: user.role, outletId });

  const where = buildOutletOrderWhere(outletIds, { status: ORDER_STATUS.NEW });
  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { data, page, limit, total };
};

export const listFilteredOrdersService = async ({ user, outletId, status, page, limit }) => {
  const outletIds = await getManagedOutletIds({ userId: user.id, role: user.role, outletId });

  const skip = (page - 1) * limit;

  // Build the dynamic where clause
  const where = {
    product: { outletId: { in: outletIds } },
    ...(status ? { status } : {}),
  };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    data: orders.map(toOrderCard),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const decideOrderService = async ({ user, outletId, orderId, decision, reason }) => {
  const outletIds = await getManagedOutletIds({ userId: user.id, role: user.role, outletId });
  const existing = await getScopedOrderOrThrow({ orderId, outletIds });

  if (existing.status !== ORDER_STATUS.NEW) {
    throw new ApiError(400, "Only newly placed orders can be accepted or rejected");
  }

  const nextStatus = decision === "ACCEPT" ? "CONFIRMED" : "CANCELLED";
  const notesLabel = decision === "ACCEPT" ? "accepted_by" : "rejected_reason";
  const notesValue = decision === "ACCEPT" ? user.id : reason;

  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: nextStatus,
      notes: appendContextNote(existing.notes, notesLabel, notesValue),
    },
    include: ORDER_INCLUDE,
  });
};

export const listQcPendingOrdersService = async ({ user, outletId, page, limit }) => {
  const outletIds = await getManagedOutletIds({ userId: user.id, role: user.role, outletId });

  const where = buildOutletOrderWhere(outletIds, { status: ORDER_STATUS.QC_PENDING });
  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { data, page, limit, total };
};

export const decideQcService = async ({ user, outletId, orderId, decision, notes }) => {
  const outletIds = await getManagedOutletIds({ userId: user.id, role: user.role, outletId });
  const existing = await getScopedOrderOrThrow({ orderId, outletIds });

  if (existing.status !== ORDER_STATUS.QC_PENDING) {
    throw new ApiError(400, "Only QC pending orders can be processed here");
  }

  const status = decision === "PASS" ? ORDER_STATUS.READY_TO_DISPATCH : "CANCELLED";

  return prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      notes: appendContextNote(existing.notes, "qc_notes", notes),
    },
    include: ORDER_INCLUDE,
  });
};

export const getDispatchQueuesService = async ({ user, outletId, page, limit }) => {
  const outletIds = await getManagedOutletIds({ userId: user.id, role: user.role, outletId });

  const packingWhere = buildOutletOrderWhere(outletIds, { status: ORDER_STATUS.QC_PENDING });
  const shippingWhere = buildOutletOrderWhere(outletIds, { status: ORDER_STATUS.READY_TO_DISPATCH });

  const [packingOrders, shippingOrders] = await Promise.all([
    prisma.order.findMany({
      where: packingWhere,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.findMany({
      where: shippingWhere,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    readyForPacking: packingOrders,
    readyForShipping: shippingOrders,
  };
};

export const listReturnsPendingService = async ({ user, outletId, page, limit }) => {
  const outletIds = await getManagedOutletIds({ userId: user.id, role: user.role, outletId });

  const where = buildOutletOrderWhere(outletIds, { status: ORDER_STATUS.RETURN_PENDING });
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  const enriched = await Promise.all(
    orders.map(async (order) => {
      const latestReview = await prisma.review.findFirst({
        where: {
          productId: order.productId,
          userId: order.userId,
        },
        orderBy: { createdAt: "desc" },
        select: {
          rating: true,
          comment: true,
          wouldRecommend: true,
          createdAt: true,
        },
      });

      return {
        ...order,
        returnReason: order.notes,
        latestFeedback: latestReview,
      };
    }),
  );

  return {
    data: enriched,
    page,
    limit,
    total,
  };
};

export const listLowStockProductsService = async ({ user, outletId, threshold, page, limit }) => {
  const outletIds = await getManagedOutletIds({ userId: user.id, role: user.role, outletId });

  const where = buildOutletProductWhere(outletIds, {
    isActive: true,
    stock: { lte: threshold },
  });

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { data, page, limit, total };
};

export const updateProductStockService = async ({ user, outletId, productId, mode, quantity }) => {
  const outletIds = await getManagedOutletIds({ userId: user.id, role: user.role, outletId });
  const existing = await getScopedProductOrThrow({ productId, outletIds });

  const nextStock = mode === "SET" ? quantity : existing.stock + quantity;

  return prisma.product.update({
    where: { id: productId },
    data: { stock: nextStock },
    include: PRODUCT_INCLUDE,
  });
};

export const listOutletProductsService = async ({ user, outletId, page, limit }) => {
  const outletIds = await getManagedOutletIds({ userId: user.id, role: user.role, outletId });

  const where = buildOutletProductWhere(outletIds, {});
  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { data, page, limit, total };
};

export const getOutletProductByIdService = async ({ user, outletId, productId }) => {
  const outletIds = await getManagedOutletIds({ userId: user.id, role: user.role, outletId });
  return getScopedProductOrThrow({ productId, outletIds });
};

export const createOutletProductService = async ({ user, payload }) => {
  // 1. Fetch ALL outlets this specific manager/artisan controls automatically
  const availableOutletIds = await getManagedOutletIds({ userId: user.id, role: user.role });

  if (availableOutletIds.length === 0) {
    throw new ApiError(403, "You do not have access to any outlets to create products.");
  }
  if (availableOutletIds.length > 1) {
    throw new ApiError(400, "You manage multiple outlets. Please contact support for multi-outlet product creation.");
  }

  // 2. Safely grab their single assigned outlet
  const targetOutletId = availableOutletIds[0];

  try {
    return await prisma.$transaction(async (tx) => {
      return await tx.product.create({
        data: {
          outletId: targetOutletId, // 🔥 Smart Auto-Assignment!
          artisanId: payload.artisanId,
          categoryId: payload.categoryId,
          title: payload.title,
          slug: payload.slug,
          description: payload.description,
          specialFeatures: payload.specialFeatures,
          material: payload.material,
          actualPrice: payload.actualPrice,
          sellingPrice: payload.sellingPrice,
          stock: payload.stock,
          isActive: payload.isActive,
          ...(payload.images && payload.images.length > 0
            ? {
                images: {
                  create: payload.images.map((url, index) => ({ url, sortOrder: index })),
                },
              }
            : {}),
        },
        include: PRODUCT_INCLUDE,
      });
    });
  } catch (error) {
    if (error?.code === "P2002") throw new ApiError(409, "Product slug already exists");
    throw error;
  }
};

export const updateOutletProductService = async ({ user, productId, payload }) => {
  const availableOutletIds = await getManagedOutletIds({ userId: user.id, role: user.role });

  if (availableOutletIds.length === 0) {
    throw new ApiError(403, "You do not have access to any outlets.");
  }

  // 🔥 Automatically searches across ALL outlets this manager owns!
  const existing = await getScopedProductOrThrow({ productId, outletIds: availableOutletIds });

  const hasImages = payload.images && payload.images.length > 0;

  try {
    return await prisma.$transaction(async (tx) => {
      if (hasImages) {
        await tx.productImage.deleteMany({ where: { productId } });
      }

      return tx.product.update({
        where: { id: existing.id },
        data: {
          // Notice we DO NOT update outletId here. It stays safely in its original outlet.
          categoryId: payload.categoryId,
          artisanId: payload.artisanId,
          title: payload.title,
          slug: payload.slug,
          description: payload.description,
          specialFeatures: payload.specialFeatures,
          material: payload.material,
          actualPrice: payload.actualPrice,
          sellingPrice: payload.sellingPrice,
          stock: payload.stock,
          isActive: payload.isActive,
          ...(hasImages
            ? {
                images: {
                  create: payload.images.map((url, index) => ({ url, sortOrder: index })),
                },
              }
            : {}),
        },
        include: PRODUCT_INCLUDE,
      });
    });
  } catch (error) {
    if (error?.code === "P2002") throw new ApiError(409, "Product slug already exists");
    throw error;
  }
};

export const deleteOutletProductService = async ({ user, productId }) => {
  const availableOutletIds = await getManagedOutletIds({ userId: user.id, role: user.role });
  
  // 🔥 Automatically authorizes the delete request
  const existing = await getScopedProductOrThrow({ productId, outletIds: availableOutletIds });

  return prisma.product.update({
    where: { id: existing.id },
    data: { isActive: false },
    include: PRODUCT_INCLUDE,
  });
};

export const dispatchOrderService = async ({ user, orderId, payload }) => {
  const outletIds = await getManagedOutletIds({ userId: user.id, role: user.role });

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      product: { outletId: { in: outletIds } },
      status: "PACKED",
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found or not ready for dispatch. Ensure it has passed QC (PACKED).");
  }

  const newNotes = payload.notes
    ? `${order.notes ? order.notes + '\n' : ''}[DISPATCH UPDATE]: ${payload.notes}`
    : order.notes;

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "SHIPPED",
      notes: newNotes,
    },
    include: ORDER_INCLUDE,
  });

  return toOrderCard(updatedOrder);
};