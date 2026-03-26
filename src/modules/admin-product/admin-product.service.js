import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const productInclude = {
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
};

const assertOutletExists = async (outletId) => {
  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId },
    select: { id: true },
  });

  if (!outlet) {
    throw new ApiError(404, "Outlet not found");
  }
};

export const listAdminProductsService = async ({ search, outletId, isActive, page, limit }) => {
  const where = {};

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  if (outletId) {
    where.outletId = outletId;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { district: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data,
    page,
    limit,
    total,
  };
};

export const getAdminProductByIdService = async (productId) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: productInclude,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};

export const createAdminProductService = async (payload) => {
  await assertOutletExists(payload.outletId);

  try {
    return await prisma.product.create({
      data: {
        outletId: payload.outletId,
        title: payload.title,
        slug: payload.slug,
        description: payload.description,
        producerName: payload.producerName,
        producerStory: payload.producerStory,
        district: payload.district,
        price: payload.price,
        stock: payload.stock,
        isActive: payload.isActive,
        images: {
          create: (payload.images || []).map((url, index) => ({
            url,
            sortOrder: index,
          })),
        },
      },
      include: productInclude,
    });
  } catch (error) {
    if (error?.code === "P2002") {
      throw new ApiError(409, "Product slug already exists for this outlet");
    }

    throw error;
  }
};

export const updateAdminProductService = async (productId, payload) => {
  await getAdminProductByIdService(productId);

  if (payload.outletId) {
    await assertOutletExists(payload.outletId);
  }

  const hasImages = Object.prototype.hasOwnProperty.call(payload, "images");

  try {
    return await prisma.$transaction(async (tx) => {
      if (hasImages) {
        await tx.productImage.deleteMany({ where: { productId } });
      }

      return tx.product.update({
        where: { id: productId },
        data: {
          outletId: payload.outletId,
          title: payload.title,
          slug: payload.slug,
          description: payload.description,
          producerName: payload.producerName,
          producerStory: payload.producerStory,
          district: payload.district,
          price: payload.price,
          stock: payload.stock,
          isActive: payload.isActive,
          ...(hasImages
            ? {
                images: {
                  create: (payload.images || []).map((url, index) => ({
                    url,
                    sortOrder: index,
                  })),
                },
              }
            : {}),
        },
        include: productInclude,
      });
    });
  } catch (error) {
    if (error?.code === "P2002") {
      throw new ApiError(409, "Product slug already exists for this outlet");
    }

    throw error;
  }
};

export const deleteAdminProductService = async (productId) => {
  await getAdminProductByIdService(productId);

  return prisma.product.update({
    where: { id: productId },
    data: { isActive: false },
    include: productInclude,
  });
};
