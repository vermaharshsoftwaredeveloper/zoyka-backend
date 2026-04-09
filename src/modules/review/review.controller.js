import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import { createReviewSchema } from "./review.validation.js";
import {
  createReviewService,
  getCustomerReviewHighlightsService,
  getProductReviewsService,
} from "./review.service.js";

const parseBody = (body) => {
  const parsed = createReviewSchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid request body");
  }

  return parsed.data;
};

export const listReviewsByProduct = asyncHandler(async (req, res) => {
  const reviews = await getProductReviewsService(req.params.productId);

  res.status(200).json({
    message: "Reviews fetched successfully",
    data: reviews,
  });
});

export const createReview = asyncHandler(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, "Unauthorized");
  }

  const payload = parseBody(req.body);

  const review = await createReviewService({
    userId: req.user.id,
    productId: req.params.productId,
    ...payload,
  });

  res.status(201).json({
    message: "Review created successfully",
    data: review,
  });
});

export const getCustomerReviewHighlights = asyncHandler(async (req, res) => {
  const parsedLimit = Number(req.query.limit || 6);
  const limit = Number.isInteger(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 20) : 6;

  const data = await getCustomerReviewHighlightsService({ limit });

  res.status(200).json({
    message: "Customer review highlights fetched successfully",
    data,
  });
});
