import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import {
  departmentParamSchema,
  outletParamSchema,
  bestsellerLimitSchema,
  listProductsQuerySchema,
  topPicksQuerySchema,
} from "./product.validation.js";
import {
  getBestsellersByDepartmentService,
  getBestsellersByOutletService,
  getProductByIdService,
  getTopPicksForUserService,
  getSimilarProductsService,
  listProductsService,
} from "./product.service.js";

const parseQuery = (schema, query) => {
  const parsed = schema.safeParse(query);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid query params");
  return parsed.data;
};

const parseParams = (schema, params) => {
  const parsed = schema.safeParse(params);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid route parameters");
  return parsed.data;
};

export const listProducts = asyncHandler(async (req, res) => {
  const query = parseQuery(listProductsQuerySchema, req.query);
  const response = await listProductsService(query);

  res.status(200).json({ message: "Products fetched successfully", ...response });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await getProductByIdService(req.params.productId);
  if (!product) throw new ApiError(404, "Product not found");

  res.status(200).json({ message: "Product fetched successfully", data: product });
});

export const getDepartmentBestsellers = asyncHandler(async (req, res) => {
  const { departmentId } = parseParams(departmentParamSchema, req.params);
  const { limit } = parseQuery(bestsellerLimitSchema, req.query);

  const data = await getBestsellersByDepartmentService(departmentId, limit);

  res.status(200).json({ message: "Department bestsellers fetched successfully", data });
});

export const getOutletBestsellers = asyncHandler(async (req, res) => {
  const { outletId } = parseParams(outletParamSchema, req.params);
  const { limit } = parseQuery(bestsellerLimitSchema, req.query);

  const data = await getBestsellersByOutletService(outletId, limit);

  res.status(200).json({ message: "Outlet bestsellers fetched successfully", data });
});

export const getTopPicksForUser = asyncHandler(async (req, res) => {
  const { limit } = parseQuery(topPicksQuerySchema, req.query);

  const userId = req.user.id;

  const data = await getTopPicksForUserService({
    userId,
    limit,
  });

  res.status(200).json({
    message: "Top picks fetched successfully",
    data,
  });
});

export const getSimilarProducts = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { limit } = parseQuery(topPicksQuerySchema, req.query);

  const data = await getSimilarProductsService(productId, limit);

  res.status(200).json({
    message: "Similar products fetched successfully",
    data,
  });
});