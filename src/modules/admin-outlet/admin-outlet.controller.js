import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import {
  createAdminOutletSchema,
  listAdminOutletsQuerySchema,
  updateAdminOutletSchema,
} from "./admin-outlet.validation.js";
import {
  createAdminOutletService,
  deleteAdminOutletService,
  getAdminOutletByIdService,
  listAdminOutletsService,
  updateAdminOutletService,
} from "./admin-outlet.service.js";

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

export const listAdminOutlets = asyncHandler(async (req, res) => {
  const query = parseQuery(listAdminOutletsQuerySchema, req.query);
  const response = await listAdminOutletsService({
    ...query,
    isActive: query.isActive === undefined ? undefined : query.isActive === "true",
  });

  res.status(200).json({
    message: "Admin outlets fetched successfully",
    ...response,
  });
});

export const getAdminOutletById = asyncHandler(async (req, res) => {
  const data = await getAdminOutletByIdService(req.params.outletId);

  res.status(200).json({
    message: "Admin outlet fetched successfully",
    data,
  });
});

export const createAdminOutlet = asyncHandler(async (req, res) => {
  const payload = parseBody(createAdminOutletSchema, req.body);
  const data = await createAdminOutletService(payload);

  res.status(201).json({
    message: "Outlet created successfully",
    data,
  });
});

export const updateAdminOutlet = asyncHandler(async (req, res) => {
  const payload = parseBody(updateAdminOutletSchema, req.body);
  const data = await updateAdminOutletService(req.params.outletId, payload);

  res.status(200).json({
    message: "Outlet updated successfully",
    data,
  });
});

export const deleteAdminOutlet = asyncHandler(async (req, res) => {
  const data = await deleteAdminOutletService(req.params.outletId);

  res.status(200).json({
    message: "Outlet deleted successfully",
    data,
  });
});
