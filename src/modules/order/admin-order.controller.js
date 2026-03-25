import { asyncHandler } from "../../utils/async-handler/index.js";
import ApiError from "../../utils/api-error/index.js";
import * as adminOrderService from "./admin-order.service.js";
import { getOrdersQuerySchema } from "./admin-order.validation.js";

const parseQuery = (schema, query) => {
    const parsed = schema.safeParse(query);
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message);
    return parsed.data;
};

export const getAllOrdersAdmin = asyncHandler(async (req, res) => {
    const filters = parseQuery(getOrdersQuerySchema, req.query);
    const result = await adminOrderService.getAllOrdersAdminService(filters);
    res.status(200).json({ success: true, ...result });
});

export const getOrderByIdAdmin = asyncHandler(async (req, res) => {
    const order = await adminOrderService.getOrderByIdAdminService(req.params.id);
    res.status(200).json({ success: true, data: order });
});