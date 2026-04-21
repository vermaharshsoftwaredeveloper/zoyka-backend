import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import { addCartItemSchema, updateCartItemSchema } from "./cart.validation.js";
import {
  addCartItemService,
  clearCartService,
  getCartService,
  removeCartItemService,
  updateCartItemService,
} from "./cart.service.js";

const parseBody = (schema, body) => {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid request body");
  }

  return parsed.data;
};

export const getCart = asyncHandler(async (req, res) => {
  const data = await getCartService(req.user.id);

  res.status(200).json({
    message: "Cart fetched successfully",
    data,
  });
});

export const addCartItem = asyncHandler(async (req, res) => {
  const payload = parseBody(addCartItemSchema, req.body);
  const data = await addCartItemService({ userId: req.user.id, ...payload });

  res.status(201).json({
    message: "Cart item added successfully",
    data,
  });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const payload = parseBody(updateCartItemSchema, req.body);
  const data = await updateCartItemService({
    userId: req.user.id,
    itemId: req.params.itemId,
    ...payload,
  });

  res.status(200).json({
    message: "Cart item updated successfully",
    data,
  });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const data = await removeCartItemService({
    userId: req.user.id,
    itemId: req.params.itemId,
  });

  res.status(200).json(data);
});

export const clearCart = asyncHandler(async (req, res) => {
  const data = await clearCartService(req.user.id);

  res.status(200).json(data);
});
