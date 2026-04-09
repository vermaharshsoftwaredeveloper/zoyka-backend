import { asyncHandler } from "../../utils/async-handler/index.js";
import ApiError from "../../utils/api-error/index.js";
import * as adminOutletService from "./admin-outlet.service.js";
import { createOutletSchema, updateOutletSchema, getOutletsQuerySchema } from "./admin-outlet.validation.js";

const parseSchema = (schema, data) => {
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message);
    return parsed.data;
};

export const getAllOutletsAdmin = asyncHandler(async (req, res) => {
    const filters = parseSchema(getOutletsQuerySchema, req.query);
    const outlets = await adminOutletService.getAllOutletsAdminService(filters);
    res.status(200).json({ success: true, data: outlets });
});

export const createOutlet = asyncHandler(async (req, res) => {
    const payload = parseSchema(createOutletSchema, req.body);
    const newOutlet = await adminOutletService.createOutletService(payload);
    res.status(201).json({ success: true, message: "Producer created successfully", data: newOutlet });
});

export const updateOutlet = asyncHandler(async (req, res) => {
    const payload = parseSchema(updateOutletSchema, req.body);
    const updatedOutlet = await adminOutletService.updateOutletService(req.params.id, payload);
    res.status(200).json({ success: true, message: "Producer updated successfully", data: updatedOutlet });
});

export const toggleOutletStatus = asyncHandler(async (req, res) => {
    const updatedOutlet = await adminOutletService.toggleOutletStatusService(req.params.id);
    res.status(200).json({ success: true, message: `Producer is now ${updatedOutlet.isActive ? 'Active' : 'Inactive'}` });
});

export const getOutletById = asyncHandler(async (req, res) => {
    const outlet = await adminOutletService.getOutletByIdAdminService(req.params.id);
    res.status(200).json({ success: true, data: outlet });
});