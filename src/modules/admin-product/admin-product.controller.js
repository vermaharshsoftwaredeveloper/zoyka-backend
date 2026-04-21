import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import {
  createAdminProductSchema,
  listAdminProductsQuerySchema,
  updateAdminProductSchema,
} from "./admin-product.validation.js";
import {
  createAdminProductService,
  deleteAdminProductService,
  getAdminProductByIdService,
  listAdminProductsService,
  updateAdminProductService,
} from "./admin-product.service.js";

const parseQuery = (schema, query) => {
  const parsed = schema.safeParse(query);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid query params");
  }

  return parsed.data;
};

const parseBody = (schema, body) => {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid request body");
  }

  return parsed.data;
};

export const listAdminProducts = asyncHandler(async (req, res) => {
  const query = parseQuery(listAdminProductsQuerySchema, req.query);
  const response = await listAdminProductsService({
    ...query,
    isActive: query.isActive === undefined ? undefined : query.isActive === "true",
  });

  res.status(200).json({
    message: "Admin products fetched successfully",
    ...response,
  });
});

export const getAdminProductById = asyncHandler(async (req, res) => {
  const data = await getAdminProductByIdService(req.params.productId);

  res.status(200).json({
    message: "Admin product fetched successfully",
    data,
  });
});

export const createAdminProduct = asyncHandler(async (req, res) => {
  const payload = parseBody(createAdminProductSchema, req.body);
  const data = await createAdminProductService(payload);

  res.status(201).json({
    message: "Product created successfully",
    data,
  });
});

export const updateAdminProduct = asyncHandler(async (req, res) => {
  const payload = parseBody(updateAdminProductSchema, req.body);
  const data = await updateAdminProductService(req.params.productId, payload);

  res.status(200).json({
    message: "Product updated successfully",
    data,
  });
});

export const deleteAdminProduct = asyncHandler(async (req, res) => {
  const data = await deleteAdminProductService(req.params.productId);

  res.status(200).json({
    message: "Product deleted successfully",
    data,
  });
});
