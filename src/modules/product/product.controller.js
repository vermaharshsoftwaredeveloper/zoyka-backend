import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import {
  bestsellerQuerySchema,
  listProductsQuerySchema,
  topPicksQuerySchema,
} from "./product.validation.js";
import {
  getOutletBestsellersService,
  getProductByIdService,
  getTopPicksForUserService,
  listProductsService,
} from "./product.service.js";

const parseQuery = (schema, query) => {
  const parsed = schema.safeParse(query);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid query params");
  }

  return parsed.data;
};

export const listProducts = asyncHandler(async (req, res) => {
  const query = parseQuery(listProductsQuerySchema, req.query);
  const response = await listProductsService(query);

  res.status(200).json({
    message: "Products fetched successfully",
    ...response,
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await getProductByIdService(req.params.productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res.status(200).json({
    message: "Product fetched successfully",
    data: product,
  });
});

export const getOutletBestsellers = asyncHandler(async (req, res) => {
  const query = parseQuery(bestsellerQuerySchema, req.query);
  const data = await getOutletBestsellersService(query);

  res.status(200).json({
    message: "Outlet bestsellers fetched successfully",
    data,
  });
});

export const getTopPicksForUser = asyncHandler(async (req, res) => {
  const query = parseQuery(topPicksQuerySchema, req.query);
  const data = await getTopPicksForUserService({
    userId: req.user.id,
    limit: query.limit,
  });

  res.status(200).json({
    message: "Top picks fetched successfully",
    data,
  });
});
