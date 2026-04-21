import { asyncHandler } from "../../utils/async-handler/index.js";
import ApiError from "../../utils/api-error/index.js";
import * as staffService from "./staff.service.js";
import { addManagerSchema, updateManagerSchema } from "./staff.validation.js";

const parseBody = (schema, body) => {
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid request body");
    }
    return parsed.data;
};

export const getOperationalManagers = asyncHandler(async (req, res) => {
    const managers = await staffService.getOperationalManagersService();

    res.status(200).json({
        success: true,
        message: "Operational Managers fetched successfully",
        data: managers
    });
});

export const addOperationalManager = asyncHandler(async (req, res) => {
    const payload = parseBody(addManagerSchema, req.body);
    const newManager = await staffService.addOperationalManagerService(payload);

    res.status(201).json({
        success: true,
        message: "Operations Manager added successfully",
        data: newManager
    });
});

export const updateOperationalManager = asyncHandler(async (req, res) => {
    const payload = parseBody(updateManagerSchema, req.body);
    const managerId = req.params.managerId;
    if (!managerId) throw new ApiError(400, "Manager ID is required");

    const updated = await staffService.updateOperationalManagerService(managerId, payload);

    res.status(200).json({
        success: true,
        message: 'Operations Manager updated successfully',
        data: updated
    });
});

export const deleteOperationalManager = asyncHandler(async (req, res) => {
    const managerId = req.params.managerId;
    if (!managerId) throw new ApiError(400, "Manager ID is required");

    const deleted = await staffService.deleteOperationalManagerService(managerId);

    res.status(200).json({
        success: true,
        message: 'Operations Manager deleted successfully',
        data: deleted
    });
});