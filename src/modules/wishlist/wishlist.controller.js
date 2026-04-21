import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import { addToWishlistSchema } from "./wishlist.validation.js";
import {
  addToWishlistService,
  listWishlistService,
  removeFromWishlistService,
} from "./wishlist.service.js";

const parseBody = (body) => {
  const parsed = addToWishlistSchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid request body");
  }

  return parsed.data;
};

export const listWishlist = asyncHandler(async (req, res) => {
  const data = await listWishlistService(req.user.id);

  res.status(200).json({
    message: "Wishlist fetched successfully",
    data,
  });
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const payload = parseBody(req.body);
  const data = await addToWishlistService({ userId: req.user.id, ...payload });

  res.status(201).json({
    message: "Product added to wishlist",
    data,
  });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const data = await removeFromWishlistService({
    userId: req.user.id,
    productId: req.params.productId,
  });

  res.status(200).json(data);
});
