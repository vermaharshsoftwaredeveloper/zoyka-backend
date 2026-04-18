import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";
import { cacheGet, cacheSet, cacheInvalidatePrefix } from "../../utils/cache.js";

const FILTER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const getRatingSummary = (reviews) => {
  if (!reviews.length) {
    return { averageRating: 0, totalRatingsCount: 0 };
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
    specialFeatures: product.specialFeatures,
    material: product.material,
    actualPrice: product.actualPrice,
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
  if (!productIds.length) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: getProductCardInclude(),
  });

  const productMap = new Map(products.map((product) => [product.id, product]));
  return productIds.map((id) => productMap.get(id)).filter(Boolean);
};

export const listProductsService = async ({
  categorySlug, departmentId, search, page, limit,
  regionId, outletId, material, use, special,
  minPrice, maxPrice, sortBy,
}) => {
  const where = { isActive: true };

  if (categorySlug) {
    where.category = { slug: categorySlug, isActive: true };
  }

  if (departmentId) {
    where.category = { ...where.category, departmentId };
  }

  if (regionId) {
    where.outlet = { ...where.outlet, regionId };
  }

  if (outletId) {
    where.outletId = outletId;
  }

  if (material?.length) {
    where.material = { in: material, mode: "insensitive" };
  }

  if (use?.length) {
    where.specialFeatures = { in: use, mode: "insensitive" };
  }

  if (special?.length) {
    const specialConditions = [];
    if (special.includes("Bestseller")) {
      specialConditions.push({ totalRatingsCount: { gte: 5 } });
    }
    if (special.includes("New")) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      specialConditions.push({ createdAt: { gte: thirtyDaysAgo } });
    }
    if (special.includes("Innovative")) {
      specialConditions.push({
        specialFeatures: { not: null },
      });
    }
    if (specialConditions.length) {
      where.AND = [...(where.AND || []), { OR: specialConditions }];
    }
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.sellingPrice = {};
    if (minPrice !== undefined) where.sellingPrice.gte = minPrice;
    if (maxPrice !== undefined) where.sellingPrice.lte = maxPrice;
  }

  if (search) {
    where.AND = [...(where.AND || []), {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { specialFeatures: { contains: search, mode: "insensitive" } },
      ],
    }];
  }

  // Sorting
  let orderBy = { createdAt: "desc" };
  if (sortBy === "price_asc") orderBy = { sellingPrice: "asc" };
  else if (sortBy === "price_desc") orderBy = { sellingPrice: "desc" };
  else if (sortBy === "rating") orderBy = { averageRating: "desc" };
  else if (sortBy === "popularity") orderBy = { totalRatingsCount: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        specialFeatures: true,
        material: true,
        actualPrice: true,
        sellingPrice: true,
        stock: true,
        averageRating: true,
        totalRatingsCount: true,
        category: { select: { id: true, slug: true, name: true } },
        outlet: { select: { id: true, name: true, region: { select: { id: true, name: true } } } },
        images: { orderBy: { sortOrder: "asc" }, take: 3 },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: products.map((product) => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      specialFeatures: product.specialFeatures,
      material: product.material,
      actualPrice: product.actualPrice,
      sellingPrice: product.sellingPrice,
      stock: product.stock,
      category: product.category,
      images: product.images,
      averageRating: product.averageRating ?? 0,
      totalRatingsCount: product.totalRatingsCount ?? 0,
    })),
    page,
    limit,
    total,
  };
};

export const getFilterOptionsService = async ({ departmentId } = {}) => {
  const cacheKey = `filters:${departmentId || 'all'}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const where = { isActive: true };
  if (departmentId) {
    where.category = { departmentId };
  }

  // Use parallel distinct queries instead of fetching ALL products
  const [materials, features, priceRange, regionsRaw] = await Promise.all([
    prisma.product.findMany({
      where: { ...where, material: { not: null } },
      select: { material: true },
      distinct: ["material"],
      orderBy: { material: "asc" },
    }),
    prisma.product.findMany({
      where: { ...where, specialFeatures: { not: null } },
      select: { specialFeatures: true },
      distinct: ["specialFeatures"],
      orderBy: { specialFeatures: "asc" },
    }),
    prisma.product.aggregate({
      where,
      _max: { sellingPrice: true },
      _min: { sellingPrice: true },
    }),
    prisma.region.findMany({
      where: {
        outlets: {
          some: {
            products: { some: where },
          },
        },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const maxProductPrice = priceRange._max.sellingPrice || 0;
  const priceRanges = [];
  if (maxProductPrice > 0) {
    priceRanges.push({ label: "Under ₹500", min: 0, max: 500 });
    if (maxProductPrice > 500) priceRanges.push({ label: "₹500 - ₹1000", min: 500, max: 1000 });
    if (maxProductPrice > 1000) priceRanges.push({ label: "₹1000+", min: 1000, max: null });
  }

  const result = {
    regions: regionsRaw,
    materials: materials.map((m) => m.material),
    uses: features.map((f) => f.specialFeatures),
    priceRanges,
    specials: ["Innovative", "Bestseller", "New"],
  };

  cacheSet(cacheKey, result, FILTER_CACHE_TTL);
  return result;
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
          user: { select: { id: true, name: true } },
          images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      outlet: {
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          address: true,
          location: true,
        },
      },
      artisan: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true,
          location: true,
          yearsOfExperience: true,
        },
      },
    },
  });

  if (!product || !product.isActive) return null;

  const ratingSummary = getRatingSummary(product.reviews);

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    specialFeatures: product.specialFeatures,
    material: product.material,
    actualPrice: product.actualPrice,
    sellingPrice: product.sellingPrice,
    stock: product.stock,
    category: product.category,
    images: product.images,
    reviews: product.reviews,
    outlet: product.outlet,
    artisan: product.artisan,
    producerName: product.producerName,
    producerStory: product.producerStory,
    ...ratingSummary,
  };
};

export const getCategoryBestsellersService = async ({ categorySlug, limit }) => {
  const category = await prisma.category.findFirst({
    where: { slug: categorySlug, isActive: true },
    select: { id: true },
  });

  if (!category) throw new ApiError(404, "Category not found");

  const categoryProducts = await prisma.product.findMany({
    where: { categoryId: category.id, isActive: true },
    select: { id: true },
  });

  if (!categoryProducts.length) return [];

  const productIds = categoryProducts.map((product) => product.id);

  const groupedSales = await prisma.order.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, status: { not: "CANCELLED" } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  const rankedIds = groupedSales.map((item) => item.productId);
  const rankedProducts = await getRankedProductsByIds(rankedIds);

  if (rankedProducts.length < limit) {
    const fallbackProducts = await prisma.product.findMany({
      where: {
        categoryId: category.id,
        isActive: true,
        id: { notIn: rankedIds },
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

export const getTopPicksForUserService = async ({ userId, limit }) => {
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  let outletScore = new Map();
  let categoryScore = new Map();
  let excludedProducts = new Set();

  if (userId) {
    // Fetch user's interaction history
    const [orders, wishlist, cart, reviews] = await Promise.all([
      prisma.order.findMany({ 
        where: { userId }, 
        select: { 
          product: { 
            select: { id: true, outletId: true, categoryId: true } 
          },
          createdAt: true,
        } 
      }),
      prisma.wishlist.findMany({ 
        where: { userId }, 
        select: { 
          product: { 
            select: { id: true, outletId: true, categoryId: true } 
          } 
        } 
      }),
      prisma.cart.findUnique({ 
        where: { userId }, 
        select: { 
          items: { 
            select: { 
              product: { 
                select: { id: true, outletId: true, categoryId: true } 
              } 
            } 
          } 
        } 
      }),
      prisma.review.findMany({ 
        where: { userId }, 
        select: { 
          product: { 
            select: { id: true, outletId: true, categoryId: true } 
          } 
        } 
      }),
    ]);

    // Build preference maps with weights
    const buildUserPreferenceMap = (items, weight) => {
      for (const item of items) {
        const product = item.product;
        if (!product) continue;
        
        excludedProducts.add(product.id); // Don't show already purchased/interacted items
        
        if (product.outletId) {
          outletScore.set(product.outletId, (outletScore.get(product.outletId) || 0) + weight);
        }
        if (product.categoryId) {
          categoryScore.set(product.categoryId, (categoryScore.get(product.categoryId) || 0) + weight);
        }
      }
    };

    // Weight different interactions: Orders (highest), Wishlist, Cart, Reviews
    buildUserPreferenceMap(orders, 5);
    buildUserPreferenceMap(wishlist, 3);
    buildUserPreferenceMap(cart?.items || [], 3);
    buildUserPreferenceMap(reviews, 2);
  }

  // Get top preferred outlets and categories
  const preferredOutletIds = Array.from(outletScore.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([outletId]) => outletId);

  const preferredCategoryIds = Array.from(categoryScore.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([categoryId]) => categoryId);

  // Fetch candidate products
  const candidates = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
      id: { notIn: Array.from(excludedProducts) },
    },
    include: {
      ...getProductCardInclude(),
      orders: {
        where: {
          status: { in: ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] },
          createdAt: { gte: last30Days },
        },
        select: {
          quantity: true,
          createdAt: true,
        },
      },
    },
    take: limit * 5, // Get more candidates for better scoring
  });

  // Calculate score for each candidate
  const scoredCandidates = candidates.map((product) => {
    let score = 0;

    // 1. User Preference Score (30%)
    const outletPreference = outletScore.get(product.outletId) || 0;
    const categoryPreference = categoryScore.get(product.categoryId) || 0;
    const userPreferenceScore = (outletPreference + categoryPreference) * 0.3;

    // 2. Popularity Score (25%) - Rating quality + quantity
    const popularityScore = ((product.averageRating || 0) * 3 + 
                             Math.log10((product.totalRatingsCount || 0) + 1)) * 0.25;

    // 3. Sales Velocity Score (25%) - Recent sales activity
    const orders = product.orders || [];
    const totalRecentSales = orders.reduce((sum, o) => sum + o.quantity, 0);
    const last7DaysSales = orders.filter(o => o.createdAt >= last7Days)
                                  .reduce((sum, o) => sum + o.quantity, 0);
    const salesVelocityScore = (totalRecentSales + last7DaysSales * 2) * 0.25;

    // 4. Freshness Score (10%) - Boost newer products
    const daysSinceLaunch = (now - new Date(product.createdAt)) / (1000 * 60 * 60 * 24);
    const freshnessScore = daysSinceLaunch < 30 ? (30 - daysSinceLaunch) * 0.1 : 0;

    // 5. Stock Availability Boost (10%) - Prefer well-stocked items
    const stockScore = Math.min(product.stock / 10, 10) * 0.1;

    score = userPreferenceScore + popularityScore + salesVelocityScore + 
            freshnessScore + stockScore;

    return { product, score };
  });

  // Sort by score
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Ensure diversity - don't show too many from same category/outlet
  const diversePicks = [];
  const categoryCount = new Map();
  const outletCount = new Map();
  const MAX_PER_CATEGORY = Math.ceil(limit / 3);
  const MAX_PER_OUTLET = Math.ceil(limit / 2);

  for (const candidate of scoredCandidates) {
    if (diversePicks.length >= limit) break;

    const catCount = categoryCount.get(candidate.product.categoryId) || 0;
    const outCount = outletCount.get(candidate.product.outletId) || 0;

    if (catCount < MAX_PER_CATEGORY && outCount < MAX_PER_OUTLET) {
      diversePicks.push(candidate);
      categoryCount.set(candidate.product.categoryId, catCount + 1);
      outletCount.set(candidate.product.outletId, outCount + 1);
    }
  }

  // If we still need more products, add highest scoring ones
  if (diversePicks.length < limit) {
    for (const candidate of scoredCandidates) {
      if (diversePicks.length >= limit) break;
      if (!diversePicks.includes(candidate)) {
        diversePicks.push(candidate);
      }
    }
  }

  let picks = diversePicks.slice(0, limit).map((entry) => toProductCard(entry.product));

  // Fallback if not enough picks
  if (picks.length < limit) {
    const fallbackProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        id: { notIn: [...Array.from(excludedProducts), ...picks.map((item) => item.id)] },
      },
      include: getProductCardInclude(),
      orderBy: [
        { averageRating: "desc" },
        { totalRatingsCount: "desc" },
        { createdAt: "desc" },
      ],
      take: limit - picks.length,
    });
    picks = [...picks, ...fallbackProducts.map((item) => toProductCard(item))];
  }

  return picks;
};

export const getBestsellersByDepartmentService = async (departmentId, limit) => {
  // Get date ranges for recency weighting
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get all products in department with order data
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 }, // Only in-stock items
      category: {
        departmentId: departmentId,
        isActive: true,
      },
    },
    include: {
      ...getProductCardInclude(),
      orders: {
        where: {
          status: { in: ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] },
          createdAt: { gte: last30Days }, // Last 30 days
        },
        select: {
          quantity: true,
          createdAt: true,
          totalAmount: true,
        },
      },
    },
  });

  // Calculate scores for each product
  const scoredProducts = products.map(product => {
    const orders = product.orders || [];
    
    // Sales metrics
    const totalQuantitySold = orders.reduce((sum, o) => sum + o.quantity, 0);
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const recentSales = orders.filter(o => o.createdAt >= last7Days).length;
    
    // Popularity metrics
    const ratingScore = (product.averageRating || 0) * (product.totalRatingsCount || 0);
    
    // Calculate composite score
    // Weights: Sales Volume (40%), Revenue (20%), Recent Activity (25%), Ratings (15%)
    const salesScore = totalQuantitySold * 0.4;
    const revenueScore = (totalRevenue / 100) * 0.2; // Normalize revenue
    const recencyScore = recentSales * 5 * 0.25; // Weight recent sales heavily
    const popularityScore = (ratingScore / 10) * 0.15;
    
    const finalScore = salesScore + revenueScore + recencyScore + popularityScore;

    return {
      product,
      score: finalScore,
      totalSoldQuantity: totalQuantitySold,
      salesVelocity: recentSales, // Sales in last 7 days
    };
  });

  // Sort by score and return top items
  scoredProducts.sort((a, b) => b.score - a.score);

  return scoredProducts.slice(0, limit).map(item => ({
    ...toProductCard(item.product),
    totalSoldQuantity: item.totalSoldQuantity,
    salesVelocity: item.salesVelocity,
  }));
};

export const getBestsellersByOutletService = async (outletId, limit) => {
  // Get date ranges for recency weighting
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get all products from outlet with order data
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 }, // Only in-stock items
      outletId: outletId,
    },
    include: {
      ...getProductCardInclude(),
      orders: {
        where: {
          status: { in: ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] },
          createdAt: { gte: last30Days }, // Last 30 days
        },
        select: {
          quantity: true,
          createdAt: true,
          totalAmount: true,
        },
      },
    },
  });

  // Calculate scores for each product
  const scoredProducts = products.map(product => {
    const orders = product.orders || [];
    
    // Sales metrics
    const totalQuantitySold = orders.reduce((sum, o) => sum + o.quantity, 0);
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const recentSales = orders.filter(o => o.createdAt >= last7Days).length;
    
    // Popularity metrics
    const ratingScore = (product.averageRating || 0) * (product.totalRatingsCount || 0);
    
    // Calculate composite score
    const salesScore = totalQuantitySold * 0.4;
    const revenueScore = (totalRevenue / 100) * 0.2;
    const recencyScore = recentSales * 5 * 0.25;
    const popularityScore = (ratingScore / 10) * 0.15;
    
    const finalScore = salesScore + revenueScore + recencyScore + popularityScore;

    return {
      product,
      score: finalScore,
      totalSoldQuantity: totalQuantitySold,
      salesVelocity: recentSales,
    };
  });

  // Sort by score and return top items
  scoredProducts.sort((a, b) => b.score - a.score);

  return scoredProducts.slice(0, limit).map(item => ({
    ...toProductCard(item.product),
    totalSoldQuantity: item.totalSoldQuantity,
    salesVelocity: item.salesVelocity,
  }));
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