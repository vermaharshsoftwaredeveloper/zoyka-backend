import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";
import { uploadImage, deleteImage } from "../../services/upload.service.js";

// Helper to save data URL images (Supabase-first, local fallback)
const saveDataUrlImage = async (dataUrl, folder = "reviews") => {
  if (!dataUrl || !dataUrl.startsWith("data:image/")) {
    return null;
  }
  try {
    return await uploadImage(dataUrl, folder, "review");
  } catch {
    return null;
  }
};

const recalculateProductRatings = async (productId) => {
  const result = await prisma.review.aggregate({
    where: { productId },
    _count: { id: true },
    _avg: { rating: true },
  });

  const totalRatingsCount = result._count.id || 0;
  const averageRating = totalRatingsCount
    ? Number((result._avg.rating || 0).toFixed(1))
    : 0;

  await prisma.product.update({
    where: { id: productId },
    data: { averageRating, totalRatingsCount },
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
  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, title: true },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Check if user has purchased and received this product
  const deliveredOrder = await prisma.order.findFirst({
    where: {
      userId,
      productId,
      status: 'DELIVERED',
    },
    select: { id: true },
  });

  if (!deliveredOrder) {
    throw new ApiError(403, "You can only review products that you have purchased and received");
  }

  // Check if user has already reviewed this product
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

  if (existingReview) {
    throw new ApiError(400, "You have already reviewed this product");
  }

  // Convert data URL images to saved file URLs (async)
  const savedImageUrls = (
    await Promise.all(
      images.map((dataUrl) => saveDataUrlImage(dataUrl, "reviews"))
    )
  ).filter(Boolean);

  const review = await prisma.review.create({
    data: {
      userId,
      productId,
      rating,
      comment,
      wouldRecommend,
      images: {
        create: savedImageUrls.map((url, index) => ({
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

export const getUserReviewForProductService = async (userId, productId) => {
  return prisma.review.findFirst({
    where: { userId, productId },
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
};

export const updateReviewService = async ({ reviewId, userId, productId, rating, comment, wouldRecommend, images }) => {
  const existing = await prisma.review.findFirst({
    where: { id: reviewId, userId, productId },
    select: { id: true, images: { select: { url: true } } },
  });

  if (!existing) {
    throw new ApiError(404, "Review not found");
  }

  // Save new images if provided
  const savedImageUrls = images && images.length > 0
    ? (await Promise.all(images.map((dataUrl) => saveDataUrlImage(dataUrl, "reviews")))).filter(Boolean)
    : [];

  // Delete old images and add new ones if new images were uploaded
  const imageUpdate = savedImageUrls.length > 0
    ? {
        deleteMany: {},
        create: savedImageUrls.map((url, index) => ({ url, sortOrder: index })),
      }
    : undefined;

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating,
      comment,
      wouldRecommend,
      ...(imageUpdate && { images: imageUpdate }),
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

  // Clean up old images from storage (best-effort)
  if (imageUpdate && existing.images?.length > 0) {
    for (const oldImg of existing.images) {
      if (oldImg.url && !savedImageUrls.includes(oldImg.url)) {
        await deleteImage(oldImg.url);
      }
    }
  }

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
