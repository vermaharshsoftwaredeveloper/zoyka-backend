import { asyncHandler } from "../../utils/async-handler/index.js";
import { getDashboardAggregations } from "./dashboard.service.js";
import { dashboardQuerySchema } from "./dashboard.validation.js";
import ApiError from "../../utils/api-error/index.js";

const parseQuery = (schema, query) => {
    const parsed = schema.safeParse({ query });
    if (!parsed.success) {
        throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid query parameters");
    }
    return parsed.data.query;
};

export const getDashboardMetrics = asyncHandler(async (req, res) => {
    const { period } = parseQuery(dashboardQuerySchema, req.query);

    const dashboardData = await getDashboardAggregations(period);

    res.status(200).json({
        success: true,
        message: "Admin dashboard metrics fetched successfully",
        data: dashboardData
    });
});