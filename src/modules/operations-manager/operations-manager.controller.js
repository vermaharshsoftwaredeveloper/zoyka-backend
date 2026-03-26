import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import {
  createOutletProductSchema,
  dashboardQuerySchema,
  listLowStockQuerySchema,
  listScopeQuerySchema,
  orderDecisionSchema,
  qcDecisionSchema,
  updateOutletProductSchema,
  updateStockSchema,
} from "./operations-manager.validation.js";
import {
  createOutletProductService,
  decideOrderService,
  decideQcService,
  deleteOutletProductService,
  getDispatchQueuesService,
  getOpsDashboardService,
  getOutletProductByIdService,
  listLowStockProductsService,
  listNewOrdersService,
  listOutletProductsService,
  listQcPendingOrdersService,
  listReturnsPendingService,
  updateOutletProductService,
  updateProductStockService,
} from "./operations-manager.service.js";

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

export const getOpsDashboard = asyncHandler(async (req, res) => {
  const query = parseQuery(dashboardQuerySchema, req.query);
  const data = await getOpsDashboardService({ user: req.user, ...query });

  res.status(200).json({
    success: true,
    message: "Outlet operations dashboard fetched successfully",
    data,
  });
});

export const listNewOrders = asyncHandler(async (req, res) => {
  const query = parseQuery(listScopeQuerySchema, req.query);
  const response = await listNewOrdersService({ user: req.user, ...query });

  res.status(200).json({
    success: true,
    message: "New orders fetched successfully",
    ...response,
  });
});

export const decideOrder = asyncHandler(async (req, res) => {
  const query = parseQuery(listScopeQuerySchema.pick({ outletId: true }), req.query);
  const payload = parseBody(orderDecisionSchema, req.body);

  const data = await decideOrderService({
    user: req.user,
    outletId: query.outletId,
    orderId: req.params.orderId,
    ...payload,
  });

  res.status(200).json({
    success: true,
    message: `Order ${payload.decision === "ACCEPT" ? "accepted" : "rejected"} successfully`,
    data,
  });
});

export const listQcPendingOrders = asyncHandler(async (req, res) => {
  const query = parseQuery(listScopeQuerySchema, req.query);
  const response = await listQcPendingOrdersService({ user: req.user, ...query });

  res.status(200).json({
    success: true,
    message: "QC pending orders fetched successfully",
    ...response,
  });
});

export const decideQc = asyncHandler(async (req, res) => {
  const query = parseQuery(listScopeQuerySchema.pick({ outletId: true }), req.query);
  const payload = parseBody(qcDecisionSchema, req.body);

  const data = await decideQcService({
    user: req.user,
    outletId: query.outletId,
    orderId: req.params.orderId,
    ...payload,
  });

  res.status(200).json({
    success: true,
    message: `QC ${payload.decision === "PASS" ? "passed" : "failed"} successfully`,
    data,
  });
});

export const getDispatchQueues = asyncHandler(async (req, res) => {
  const query = parseQuery(listScopeQuerySchema, req.query);
  const data = await getDispatchQueuesService({ user: req.user, ...query });

  res.status(200).json({
    success: true,
    message: "Dispatch queues fetched successfully",
    data,
  });
});

export const listReturnsPending = asyncHandler(async (req, res) => {
  const query = parseQuery(listScopeQuerySchema, req.query);
  const response = await listReturnsPendingService({ user: req.user, ...query });

  res.status(200).json({
    success: true,
    message: "Returns pending orders fetched successfully",
    ...response,
  });
});

export const listLowStockProducts = asyncHandler(async (req, res) => {
  const query = parseQuery(listLowStockQuerySchema, req.query);
  const response = await listLowStockProductsService({ user: req.user, ...query });

  res.status(200).json({
    success: true,
    message: "Low stock products fetched successfully",
    ...response,
  });
});

export const updateProductStock = asyncHandler(async (req, res) => {
  const query = parseQuery(listScopeQuerySchema.pick({ outletId: true }), req.query);
  const payload = parseBody(updateStockSchema, req.body);

  const data = await updateProductStockService({
    user: req.user,
    outletId: query.outletId,
    productId: req.params.productId,
    ...payload,
  });

  res.status(200).json({
    success: true,
    message: "Product stock updated successfully",
    data,
  });
});

export const listOutletProducts = asyncHandler(async (req, res) => {
  const query = parseQuery(listScopeQuerySchema, req.query);
  const response = await listOutletProductsService({ user: req.user, ...query });

  res.status(200).json({
    success: true,
    message: "Outlet products fetched successfully",
    ...response,
  });
});

export const getOutletProductById = asyncHandler(async (req, res) => {
  const query = parseQuery(listScopeQuerySchema.pick({ outletId: true }), req.query);
  const data = await getOutletProductByIdService({
    user: req.user,
    outletId: query.outletId,
    productId: req.params.productId,
  });

  res.status(200).json({
    success: true,
    message: "Outlet product fetched successfully",
    data,
  });
});

export const createOutletProduct = asyncHandler(async (req, res) => {
  const payload = parseBody(createOutletProductSchema, req.body);
  const data = await createOutletProductService({ user: req.user, payload });

  res.status(201).json({
    success: true,
    message: "Outlet product created successfully",
    data,
  });
});

export const updateOutletProduct = asyncHandler(async (req, res) => {
  const query = parseQuery(listScopeQuerySchema.pick({ outletId: true }), req.query);
  const payload = parseBody(updateOutletProductSchema, req.body);
  const data = await updateOutletProductService({
    user: req.user,
    outletId: query.outletId,
    productId: req.params.productId,
    payload,
  });

  res.status(200).json({
    success: true,
    message: "Outlet product updated successfully",
    data,
  });
});

export const deleteOutletProduct = asyncHandler(async (req, res) => {
  const query = parseQuery(listScopeQuerySchema.pick({ outletId: true }), req.query);
  const data = await deleteOutletProductService({
    user: req.user,
    outletId: query.outletId,
    productId: req.params.productId,
  });

  res.status(200).json({
    success: true,
    message: "Outlet product deleted successfully",
    data,
  });
});
