import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const getRatingSummary = (reviews) => {
  if (!reviews.length) {
    return {
      averageRating: 0,
      totalRatingsCount: 0,
    };
  }

  const totalRatingsCount = reviews.length;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);

  return {
    averageRating: Number((total / totalRatingsCount).toFixed(1)),
    totalRatingsCount,
  };
};

const toProductCard = (product) => {
  const ratingSummary = product.reviews
    ? getRatingSummary(product.reviews)
    : {
      averageRating: product.averageRating ?? 0,
      totalRatingsCount: product.totalRatingsCount ?? 0,
    };

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    producerName: product.producerName,
    producerStory: product.producerStory,
    district: product.district,
    price: product.actualPrice,
    sellingPrice: product.sellingPrice,
    stock: product.stock,
    category: product.category,
    images: product.images,
    ...ratingSummary,
  };
};

const getProductCardInclude = () => ({
  category: { select: { id: true, slug: true, name: true } },
  images: { orderBy: { sortOrder: "asc" } },
});

const getRankedProductsByIds = async (productIds) => {
  if (!productIds.length) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
    include: getProductCardInclude(),
  });

  const productMap = new Map(products.map((product) => [product.id, product]));

  return productIds.map((id) => productMap.get(id)).filter(Boolean);
};

export const listProductsService = async ({ categorySlug, district, search, page, limit }) => {
  const where = {
    isActive: true,
  };

  if (categorySlug) {
    where.category = { slug: categorySlug, isActive: true };
  }

  if (district) {
    where.district = { contains: district, mode: "insensitive" };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { producerName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        images: { orderBy: { sortOrder: "asc" } },
        reviews: { select: { rating: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: products.map(toProductCard),
    page,
    limit,
    total,
  };
};

export const getProductByIdService = async (productId) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: { select: { id: true, slug: true, name: true } },
      images: { orderBy: { sortOrder: "asc" } },
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, url: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product || !product.isActive) {
    return null;
  }

  const ratingSummary = getRatingSummary(product.reviews);

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    producerName: product.producerName,
    producerStory: product.producerStory,
    district: product.district,
    price: product.actualPrice,
    sellingPrice: product.sellingPrice,
    stock: product.stock,
    category: product.category,
    images: product.images,
    reviews: product.reviews,
    ...ratingSummary,
  };
};

export const getCategoryBestsellersService = async ({ categorySlug, limit }) => {
  const category = await prisma.category.findFirst({
    where: {
      slug: categorySlug,
      isActive: true,
    },
    select: { id: true },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const categoryProducts = await prisma.product.findMany({
    where: {
      categoryId: category.id,
      isActive: true,
    },
    select: { id: true },
  });

  if (!categoryProducts.length) {
    return [];
  }

  const productIds = categoryProducts.map((product) => product.id);

  const groupedSales = await prisma.order.groupBy({
    by: ["productId"],
    where: {
      productId: { in: productIds },
      status: { not: "CANCELLED" },
    },
    _sum: { quantity: true },
    orderBy: {
      _sum: { quantity: "desc" },
    },
    take: limit,
  });

  const rankedIds = groupedSales.map((item) => item.productId);
  const rankedProducts = await getRankedProductsByIds(rankedIds);

  if (rankedProducts.length < limit) {
    const fallbackProducts = await prisma.product.findMany({
      where: {
        categoryId: category.id,
        isActive: true,
        id: {
          notIn: rankedIds,
        },
      },
      orderBy: [{ totalRatingsCount: "desc" }, { createdAt: "desc" }],
      take: limit - rankedProducts.length,
      include: getProductCardInclude(),
    });

    rankedProducts.push(...fallbackProducts);
  }

  const salesMap = new Map(groupedSales.map((entry) => [entry.productId, entry._sum.quantity || 0]));

  return rankedProducts.slice(0, limit).map((product) => ({
    ...toProductCard(product),
    totalSoldQuantity: salesMap.get(product.id) || 0,
  }));
};

const buildPreferenceMap = (items, weight) => {
  const outletMap = new Map();
  const districtMap = new Map();
  const excludedProducts = new Set();

  for (const item of items) {
    const product = item.product;

    if (!product) {
      continue;
    }

    excludedProducts.add(product.id);

    outletMap.set(product.outletId, (outletMap.get(product.outletId) || 0) + weight);
    districtMap.set(product.district, (districtMap.get(product.district) || 0) + weight);
  }

  return { outletMap, districtMap, excludedProducts };
};

const mergeScoreMap = (target, source) => {
  for (const [key, value] of source.entries()) {
    target.set(key, (target.get(key) || 0) + value);
  }
};

export const getTopPicksForUserService = async ({ userId, limit }) => {
  const [orders, wishlist, cart, reviews] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      select: {
        product: {
          select: {
            id: true,
            outletId: true,
            district: true,
          },
        },
      },
    }),
    prisma.wishlist.findMany({
      where: { userId },
      select: {
        product: {
          select: {
            id: true,
            outletId: true,
            district: true,
          },
        },
      },
    }),
    prisma.cart.findUnique({
      where: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },  
    }),
    prisma.review.findMany({
      where: { userId },
      select: {
        product: {
          select: {
            id: true,
            outletId: true,
            district: true,
          },
        },
      },
    }),
  ]);

  const outletScore = new Map();
  const districtScore = new Map();
  const excludedProducts = new Set();

  const sources = [
    buildPreferenceMap(orders, 3),
    buildPreferenceMap(wishlist, 2),
    buildPreferenceMap(cart?.items || [], 2),
    buildPreferenceMap(reviews, 1),
  ];

  for (const source of sources) {
    mergeScoreMap(outletScore, source.outletMap);
    mergeScoreMap(districtScore, source.districtMap);

    for (const productId of source.excludedProducts) {
      excludedProducts.add(productId);
    }
  }

  const preferredOutletIds = Array.from(outletScore.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([outletId]) => outletId);

  const preferredDistricts = Array.from(districtScore.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([district]) => district);

  const candidates = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
      id: {
        notIn: Array.from(excludedProducts),
      },
      ...(preferredOutletIds.length || preferredDistricts.length
        ? {
          OR: [
            ...(preferredOutletIds.length ? [{ outletId: { in: preferredOutletIds } }] : []),
            ...(preferredDistricts.length ? [{ district: { in: preferredDistricts } }] : []),
          ],
        }
        : {}),
    },
    include: getProductCardInclude(),
    take: limit * 4,
    orderBy: [{ totalRatingsCount: "desc" }, { createdAt: "desc" }],
  });

  const scoredCandidates = candidates.map((product) => {
    const outletPreference = outletScore.get(product.outletId) || 0;
    const districtPreference = districtScore.get(product.district) || 0;
    const popularityScore = (product.averageRating || 0) * 2 + Math.log10((product.totalRatingsCount || 0) + 1);

    return {
      product,
      score: outletPreference * 1.5 + districtPreference * 1.2 + popularityScore,
    };
  });

  scoredCandidates.sort((a, b) => b.score - a.score);

  let picks = scoredCandidates.slice(0, limit).map((entry) => toProductCard(entry.product));

  if (picks.length < limit) {
    const fallbackProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        id: {
          notIn: [...Array.from(excludedProducts), ...picks.map((item) => item.id)],
        },
      },
      include: getProductCardInclude(),
      orderBy: [{ totalRatingsCount: "desc" }, { createdAt: "desc" }],
      take: limit - picks.length,
    });

    picks = [...picks, ...fallbackProducts.map((item) => toProductCard(item))];
  }

  return picks;
};

export const getBestsellersByDepartmentService = async (departmentId, limit) => {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      category: {
        departmentId: departmentId,
      },
    },
    include: getProductCardInclude(),
    orderBy: [
      { totalRatingsCount: "desc" },
      { averageRating: "desc" },
    ],
    take: limit,
  });

  return products.map(toProductCard);
};

export const getBestsellersByOutletService = async (outletId, limit) => {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      outletId: outletId,
    },
    include: getProductCardInclude(),
    orderBy: [
      { totalRatingsCount: "desc" },
      { averageRating: "desc" },
    ],
    take: limit,
  });

  return products.map(toProductCard);
};

export const getSimilarProductsService = async (productId, limit = 6) => {
  try {
    //  ensure limit is number
    limit = Number(limit) || 6;

    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        categoryId: true,
        outletId: true,
        district: true,
      },
    });

    //  handle null properly
    if (!currentProduct) {
      throw new ApiError(404, "Product not found");
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        id: { not: productId },

        OR: [
          { categoryId: currentProduct.categoryId },
          { outletId: currentProduct.outletId },
          { district: currentProduct.district },
        ],
      },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: [
        { totalRatingsCount: "desc" },
        { averageRating: "desc" },
      ],
      take: limit,
    });

    return products;
  } catch (err) {
    console.error(" Similar Products Service Error:", err);
    throw new ApiError(500, "Failed to fetch similar products");
  }
};