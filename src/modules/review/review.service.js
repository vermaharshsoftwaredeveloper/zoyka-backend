import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const recalculateProductRatings = async (productId) => {
  const reviews = await prisma.review.findMany({
    where: { productId },
    select: { rating: true },
  });

  const totalRatingsCount = reviews.length;
  const averageRating = totalRatingsCount
    ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / totalRatingsCount).toFixed(1))
    : 0;

  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating,
      totalRatingsCount,
    },
  });
};

export const getProductReviewsService = async (productId) => {
  return prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      comment: true,
      wouldRecommend: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      images: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          url: true,
        },
      },
    },
  });
};

export const createReviewService = async ({ userId, productId, rating, comment, wouldRecommend, images }) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, isActive: true },
  });

  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found");
  }

  const existingReview = await prisma.review.findFirst({
    where: {
      userId,
      productId,
    },
    select: { id: true },
  });

  if (existingReview) {
    throw new ApiError(400, "You have already reviewed this product");
  }

  const review = await prisma.review.create({
    data: {
      userId,
      productId,
      rating,
      comment,
      wouldRecommend,
      images: {
        create: images.map((url, index) => ({
          url,
          sortOrder: index,
        })),
      },
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      wouldRecommend: true,
      createdAt: true,
      images: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, url: true },
      },
    },
  });

  await recalculateProductRatings(productId);

  return review;
};

export const getCustomerReviewHighlightsService = async ({ limit }) => {
  const [totals, bestReviews] = await Promise.all([
    prisma.review.aggregate({
      _count: { id: true },
      _avg: { rating: true },
    }),
    prisma.review.findMany({
      where: {
        rating: { gte: 4 },
      },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        rating: true,
        comment: true,
        wouldRecommend: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            images: {
              orderBy: { sortOrder: "asc" },
              take: 1,
              select: { url: true },
            },
          },
        },
        images: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, url: true },
        },
      },
    }),
  ]);

  const recommendCount = await prisma.review.count({
    where: { wouldRecommend: true },
  });

  const totalReviewCount = totals._count.id || 0;
  const averageRating = Number((totals._avg.rating || 0).toFixed(1));
  const recommendPercentage = totalReviewCount
    ? Number(((recommendCount / totalReviewCount) * 100).toFixed(1))
    : 0;

  return {
    stats: {
      totalReviewCount,
      averageRating,
      recommendPercentage,
    },
    bestReviews,
  };
};
