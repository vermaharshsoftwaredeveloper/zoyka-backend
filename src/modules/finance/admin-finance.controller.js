import { asyncHandler } from "../../utils/async-handler/index.js";
import ApiError from "../../utils/api-error/index.js";
import * as adminFinanceService from "./admin-finance.service.js";
import { getFinanceQuerySchema } from "./admin-finance.validation.js";

const parseQuery = (schema, query) => {
    const parsed = schema.safeParse(query);
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message);
    return parsed.data;
};

export const getFinanceDashboard = asyncHandler(async (req, res) => {
    const filters = parseQuery(getFinanceQuerySchema, req.query);
    const dashboardData = await adminFinanceService.getFinanceDashboardService(filters);

    res.status(200).json({ success: true, data: dashboardData });
});