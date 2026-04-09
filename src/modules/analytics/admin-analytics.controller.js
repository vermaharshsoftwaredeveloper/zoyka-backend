import { asyncHandler } from "../../utils/async-handler/index.js";
import ApiError from "../../utils/api-error/index.js";
import * as adminAnalyticsService from "./admin-analytics.service.js";
import { getAnalyticsQuerySchema } from "./admin-analytics.validation.js";

const parseQuery = (schema, query) => {
    const parsed = schema.safeParse(query);
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message);
    return parsed.data;
};

export const getAnalyticsDashboard = asyncHandler(async (req, res) => {
    const filters = parseQuery(getAnalyticsQuerySchema, req.query);
    const data = await adminAnalyticsService.getAnalyticsDashboardService(filters);
    res.status(200).json({ success: true, data });
});