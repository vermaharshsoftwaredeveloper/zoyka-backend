import { asyncHandler } from "../../utils/async-handler/index.js";
import * as regionService from "./region.service.js";
import { getRegionsQuerySchema } from "./region.validation.js";
import ApiError from "../../utils/api-error/index.js";

const parseQuery = (schema, query) => {
  const parsed = schema.safeParse(query);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid query params");
  return parsed.data;
};

export const getAllRegions = asyncHandler(async (req, res) => {
  const query = parseQuery(getRegionsQuerySchema, req.query);
  const regions = await regionService.getAllRegionsService(query);

  res.status(200).json({
    success: true,
    message: "Regions fetched successfully",
    data: regions,
  });
});
