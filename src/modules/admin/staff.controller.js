import { asyncHandler } from "../../utils/async-handler/index.js";
import * as staffService from "./staff.service.js";

export const getOperationalManagers = asyncHandler(async (req, res) => {
    const managers = await staffService.getOperationalManagersService();

    res.status(200).json({
        success: true,
        message: "Operational Managers fetched successfully",
        data: managers
    });
});