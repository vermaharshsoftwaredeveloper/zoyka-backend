import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import {
  createAdminBannerSchema,
  listAdminBannersQuerySchema,
  updateAdminBannerSchema,
} from "./admin-banner.validation.js";
import {
  createAdminBannerService,
  deleteAdminBannerService,
  getAdminBannerByIdService,
  listAdminBannersService,
  updateAdminBannerService,
} from "./admin-banner.service.js";

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

export const listAdminBanners = asyncHandler(async (req, res) => {
  const query = parseQuery(listAdminBannersQuerySchema, req.query);
  const response = await listAdminBannersService({
    ...query,
    isActive: query.isActive === undefined ? undefined : query.isActive === "true",
  });

  res.status(200).json({
    message: "Admin banners fetched successfully",
    ...response,
  });
});

export const getAdminBannerById = asyncHandler(async (req, res) => {
  const data = await getAdminBannerByIdService(req.params.bannerId);

  res.status(200).json({
    message: "Admin banner fetched successfully",
    data,
  });
});

export const createAdminBanner = asyncHandler(async (req, res) => {
  const payload = parseBody(createAdminBannerSchema, req.body);
  const data = await createAdminBannerService(payload);

  res.status(201).json({
    message: "Banner created successfully",
    data,
  });
});

export const updateAdminBanner = asyncHandler(async (req, res) => {
  const payload = parseBody(updateAdminBannerSchema, req.body);
  const data = await updateAdminBannerService(req.params.bannerId, payload);

  res.status(200).json({
    message: "Banner updated successfully",
    data,
  });
});

export const deleteAdminBanner = asyncHandler(async (req, res) => {
  const data = await deleteAdminBannerService(req.params.bannerId);

  res.status(200).json({
    message: "Banner deleted successfully",
    data,
  });
});
