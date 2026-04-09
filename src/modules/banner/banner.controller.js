import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import { listBannersQuerySchema } from "./banner.validation.js";
import { listActiveBannersService } from "./banner.service.js";

const parseQuery = (schema, query) => {
  const parsed = schema.safeParse(query);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid query params");
  }

  return parsed.data;
};

export const listBanners = asyncHandler(async (req, res) => {
  const query = parseQuery(listBannersQuerySchema, req.query);
  const data = await listActiveBannersService(query);

  res.status(200).json({
    message: "Banners fetched successfully",
    data,
  });
});
