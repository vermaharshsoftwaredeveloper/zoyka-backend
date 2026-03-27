import { asyncHandler } from "../../utils/async-handler/index.js";
import ApiError from "../../utils/api-error/index.js";
import * as adminCustomerService from "./admin-customer.service.js";
import { getCustomersQuerySchema, getCustomerOrdersQuerySchema } from "./admin-customer.validation.js";

const parseQuery = (schema, query) => {
    const parsed = schema.safeParse(query);
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message);
    return parsed.data;
};

export const getAllCustomers = asyncHandler(async (req, res) => {
    const filters = parseQuery(getCustomersQuerySchema, req.query);
    const result = await adminCustomerService.getAllCustomersService(filters);
    res.status(200).json({ success: true, data: result });
});

export const getCustomerById = asyncHandler(async (req, res) => {
    const filters = parseQuery(getCustomerOrdersQuerySchema, req.query);
    const result = await adminCustomerService.getCustomerByIdService(req.params.id, filters);
    res.status(200).json({ success: true, data: result });
});

export const getNewCustomers = asyncHandler(async (req, res) => {
    const result = await adminCustomerService.getNewCustomersService();
    res.status(200).json({ success: true, data: result });
});

export const verifyCustomer = asyncHandler(async (req, res) => {
    const result = await adminCustomerService.verifyCustomerService(req.params.id);
    res.status(200).json({ success: true, message: "Customer successfully verified", data: result });
});