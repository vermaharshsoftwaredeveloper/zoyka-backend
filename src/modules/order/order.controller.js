import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import { checkoutSchema } from "./order.validation.js";
import {
  checkoutCartService,
  getOrderByIdService,
  listOrdersService,
} from "./order.service.js";

const parseBody = (body) => {
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid request body");
  }

  return parsed.data;
};

export const checkoutCart = asyncHandler(async (req, res) => {
  const payload = parseBody(req.body);

  const data = await checkoutCartService({
    userId: req.user.id,
    ...payload,
  });

  res.status(201).json({
    message: "Checkout complete. Each cart item is placed as an independent order.",
    data,
  });
});

export const listOrders = asyncHandler(async (req, res) => {
  const data = await listOrdersService(req.user.id);

  res.status(200).json({
    message: "Orders fetched successfully",
    data,
  });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const data = await getOrderByIdService({
    userId: req.user.id,
    orderId: req.params.orderId,
  });

  res.status(200).json({
    message: "Order fetched successfully",
    data,
  });
});
