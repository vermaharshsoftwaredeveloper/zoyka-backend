import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";
import { uploadImage, deleteImage } from "../../services/upload.service.js";

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
    where: { variantId: null },
    orderBy: { sortOrder: "asc" },
  },
  variants: {
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
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
  variant: {
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  },
};

const ORDER_STATUS = {
  NEW: "PLACED",
  QC_PENDING: "CONFIRMED",
  READY_TO_DISPATCH: "PACKED",
  SHIPPED: "SHIPPED",
  RETURN_PENDING: "CANCELLED",
};

const normalizeSlug = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const toOrderCard = (order) => {
  return {
    id: order.id,
    status: order.status,
    quantity: order.quantity,
    unitPrice: order.unitPrice,
    totalAmount: order.totalAmount,
    notes: order.notes,
    variantId: order.variantId ?? null,
    variantLabel: order.variantLabel ?? null,
    variant: order.variant ?? null,
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

const ensureArtisanExists = async (artisanId) => {
  const artisan = await prisma.user.findFirst({
    where: { id: artisanId, role: "ARTISAN" },
    select: { id: true },
  });

  if (!artisan) {
    throw new ApiError(404, "Artisan not found");
  }
};

export const getManagedOutletIds = async ({ userId, role }) => {
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    const outlets = await prisma.outlet.findMany({
      where: { parentOutletId: null }, // only real stores, not artisan sub-outlets
      select: { id: true }
    });
    return outlets.map((o) => o.id);
  }

  if (role === "MANAGER") {
    // Manager controls exactly ONE store — return just that outlet ID
    const outlet = await prisma.outlet.findUnique({
      where: { managerId: userId },
      select: { id: true }
    });
    return outlet ? [outlet.id] : [];
  }

  // ARTISAN: may own a sub-outlet (parentOutletId set) or a standalone outlet.
  // Products should always belong to the ROOT store, not a sub-outlet.
  const ownedOutlets = await prisma.outlet.findMany({
    where: { ownerId: userId },
    select: { id: true, parentOutletId: true }
  });

  const rootIds = await Promise.all(
    ownedOutlets.map(async (o) => {
      if (o.parentOutletId) return o.parentOutletId; // resolve to parent store
      return o.id;
    })
  );

  return [...new Set(rootIds)]; // deduplicate
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

  const where = buildOutletProductWhere(outletIds, { isActive: true });
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
  // 1. Validate referenced IDs before hitting Prisma.
  await Promise.all([
    ensureCategoryExists(payload.categoryId),
    ensureArtisanExists(payload.artisanId),
  ]);

  // 2. Fetch ALL outlets this specific manager/artisan controls automatically
  const availableOutletIds = await getManagedOutletIds({ userId: user.id, role: user.role });

  if (availableOutletIds.length === 0) {
    throw new ApiError(403, "You do not have access to any outlets to create products.");
  }

  // 3. If outletId is provided, ensure the user has access to it.
  let targetOutletId = availableOutletIds[0];
  if (payload.outletId) {
    if (!availableOutletIds.includes(payload.outletId)) {
      throw new ApiError(403, "You are not authorized to create a product for the selected outlet.");
    }
    targetOutletId = payload.outletId;
  } else if (availableOutletIds.length > 1) {
    throw new ApiError(400, "You manage multiple outlets. Please select an outlet to create the product for.");
  }

  const productSlug = payload.slug ? payload.slug.trim() : normalizeSlug(payload.title);

  if (!productSlug) {
    throw new ApiError(400, "Product slug is required or could not be generated from title.");
  }

  // Pre-upload all images OUTSIDE the transaction to avoid transaction timeout.
  // Prisma transactions have a 5s default timeout; Supabase uploads can take 1-3s each.
  const uploadedProductImages = [];
  for (const [index, img] of (payload.images || []).entries()) {
    const url = await uploadImage(img, "products", "product");
    uploadedProductImages.push({ url, sortOrder: index });
  }

  // Pre-upload variant images outside the transaction as well
  const uploadedVariantImages = []; // [{ variantIndex, url, sortOrder }]
  for (const [vIdx, v] of (payload.variants || []).entries()) {
    for (const [iIdx, img] of (v.images || []).entries()) {
      const url = await uploadImage(img, "products", "product");
      uploadedVariantImages.push({ variantIndex: vIdx, url, sortOrder: iIdx });
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          outletId: targetOutletId,
          artisanId: payload.artisanId,
          categoryId: payload.categoryId,
          title: payload.title,
          slug: productSlug,
          description: payload.description,
          specialFeatures: payload.specialFeatures,
          material: payload.material,
          actualPrice: payload.actualPrice,
          sellingPrice: payload.sellingPrice,
          district: payload.district,
          producerName: payload.producerName,
          producerStory: payload.producerStory,
          stock: payload.stock,
          isActive: payload.isActive,
          ...(uploadedProductImages.length > 0
            ? { images: { create: uploadedProductImages } }
            : {}),
        },
        include: PRODUCT_INCLUDE,
      });

      // Create variants (and their images) after the product exists so we have variant IDs
      if (payload.variants && payload.variants.length > 0) {
        for (const [index, v] of payload.variants.entries()) {
          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              label: v.label,
              sellingPrice: v.sellingPrice,
              actualPrice: v.actualPrice,
              stock: v.stock ?? 0,
              isActive: v.isActive ?? true,
              sortOrder: v.sortOrder ?? index,
            },
          });
          // Attach pre-uploaded variant images
          const variantImgRows = uploadedVariantImages
            .filter((r) => r.variantIndex === index)
            .map((r) => ({ productId: product.id, variantId: variant.id, url: r.url, sortOrder: r.sortOrder }));
          if (variantImgRows.length > 0) {
            await tx.productImage.createMany({ data: variantImgRows });
          }
        }
        // Re-fetch with variants populated
        return tx.product.findUnique({ where: { id: product.id }, include: PRODUCT_INCLUDE });
      }

      return product;
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

  const existing = await getScopedProductOrThrow({ productId, outletIds: availableOutletIds });

  const hasImages = payload.images && payload.images.length > 0;

  // Pre-upload all images OUTSIDE the transaction to avoid transaction timeout.
  let processedImages = [];
  if (hasImages) {
    processedImages = await Promise.all(
      payload.images.map(async (img, index) => {
        const url = await uploadImage(img, "products", "product");
        return { url, sortOrder: index };
      })
    );
  }

  // Pre-upload variant images outside the transaction
  const uploadedVariantImages = []; // [{ variantIndex, url, sortOrder }]
  for (const [vIdx, v] of (payload.variants || []).entries()) {
    for (const [iIdx, img] of (v.images || []).entries()) {
      const url = await uploadImage(img, "products", "product");
      uploadedVariantImages.push({ variantIndex: vIdx, url, sortOrder: iIdx });
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      if (hasImages) {
        // Only delete product-level images (variantId IS NULL), not variant images
        const oldImages = await tx.productImage.findMany({
          where: { productId, variantId: null },
          select: { url: true },
        });
        await tx.productImage.deleteMany({ where: { productId, variantId: null } });

        // Clean up old images from storage (best-effort, fire-and-forget)
        const newUrls = processedImages.map((i) => i.url);
        for (const old of oldImages) {
          if (old.url && !newUrls.includes(old.url)) {
            deleteImage(old.url).catch(() => {});
          }
        }
      }

      const updatedProduct = await tx.product.update({
        where: { id: existing.id },
        data: {
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
          ...(hasImages ? { images: { create: processedImages } } : {}),
        },
        include: PRODUCT_INCLUDE,
      });

      // Handle variants: upsert existing (by id), create new, delete removed ones
      if (payload.variants !== undefined) {
        const incomingIds = payload.variants.filter((v) => v.id).map((v) => v.id);
        // Delete variants not in the incoming list (cascade deletes their images too)
        await tx.productVariant.deleteMany({
          where: { productId: existing.id, id: { notIn: incomingIds } },
        });
        // Upsert each variant
        for (const [index, v] of payload.variants.entries()) {
          let variantId;
          if (v.id) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                label: v.label,
                sellingPrice: v.sellingPrice,
                actualPrice: v.actualPrice,
                stock: v.stock ?? 0,
                isActive: v.isActive ?? true,
                sortOrder: v.sortOrder ?? index,
              },
            });
            variantId = v.id;
          } else {
            const created = await tx.productVariant.create({
              data: {
                productId: existing.id,
                label: v.label,
                sellingPrice: v.sellingPrice,
                actualPrice: v.actualPrice,
                stock: v.stock ?? 0,
                isActive: v.isActive ?? true,
                sortOrder: v.sortOrder ?? index,
              },
            });
            variantId = created.id;
          }
          // Attach pre-uploaded variant images
          const variantImgRows = uploadedVariantImages
            .filter((r) => r.variantIndex === index)
            .map((r) => ({ productId: existing.id, variantId, url: r.url, sortOrder: r.sortOrder }));
          if (variantImgRows.length > 0) {
            await tx.productImage.deleteMany({ where: { variantId } });
            await tx.productImage.createMany({ data: variantImgRows });
          }
        }
        // Re-fetch with updated variants
        return tx.product.findUnique({ where: { id: existing.id }, include: PRODUCT_INCLUDE });
      }

      return updatedProduct;
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

export const getDeliveryQueuesService = async ({ user, page, limit, type }) => {
  const outletIds = await getManagedOutletIds({ userId: user.id, role: user.role });

  const statusFilter = type === 'COMPLETED'
    ? "DELIVERED"
    : { in: ["SHIPPED", "OUT_FOR_DELIVERY"] };

  const where = {
    product: { outletId: { in: outletIds } },
    status: statusFilter,
  };

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

  return { data: orders.map(toOrderCard), total, page, limit };
};

export const markOrderDeliveredService = async ({ user, orderId, payload }) => {
  const outletIds = await getManagedOutletIds({ userId: user.id, role: user.role });

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      product: { outletId: { in: outletIds } },
      status: { in: ["SHIPPED", "OUT_FOR_DELIVERY"] },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found or not ready for delivery. Ensure it is SHIPPED.");
  }

  const newNotes = payload.notes
    ? `${order.notes ? order.notes + '\\n' : ''}[DELIVERY UPDATE]: ${payload.notes}`
    : order.notes;

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "DELIVERED",
      notes: newNotes,
    },
    include: ORDER_INCLUDE,
  });

  return toOrderCard(updatedOrder);
};