import { asyncHandler } from "../../utils/async-handler/index.js";
import ApiError from "../../utils/api-error/index.js";
import * as staffService from "./staff.service.js";
import { addManagerSchema } from "./staff.validation.js";

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