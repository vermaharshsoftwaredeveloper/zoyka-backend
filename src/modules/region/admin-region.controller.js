import { asyncHandler } from "../../utils/async-handler/index.js";
import ApiError from "../../utils/api-error/index.js";
import * as adminRegionService from "./admin-region.service.js";
import { createRegionSchema, getRegionsQuerySchema, updateRegionSchema } from "./admin-region.validation.js";

const parseBody = (schema, body) => {
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid request body");
    }
    return parsed.data;
};

const parseQuery = (schema, query) => {
    const parsed = schema.safeParse(query);
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message);
    return parsed.data;
};

export const getAllRegionsAdmin = asyncHandler(async (req, res) => {
    const filters = parseQuery(getRegionsQuerySchema, req.query);
    const regions = await adminRegionService.getAllRegionsAdminService(filters);
    res.status(200).json({ success: true, data: regions });
});

export const createRegion = asyncHandler(async (req, res) => {
    const payload = parseBody(createRegionSchema, req.body);
    const newRegion = await adminRegionService.createRegionService(payload);
    res.status(201).json({ success: true, message: "Region created successfully", data: newRegion });
});

export const updateRegion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const payload = parseBody(updateRegionSchema, req.body);
    const updatedRegion = await adminRegionService.updateRegionService(id, payload);
    res.status(200).json({ success: true, message: "Region updated successfully", data: updatedRegion });
});

export const toggleRegionStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedRegion = await adminRegionService.toggleRegionStatusService(id);
    res.status(200).json({
        success: true,
        message: `Region is now ${updatedRegion.isActive ? 'Active' : 'Inactive'}`,
        data: updatedRegion
    });
});

export const deleteRegion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const response = await adminRegionService.deleteRegionService(id);
    res.status(200).json({ success: true, message: response.message });
});