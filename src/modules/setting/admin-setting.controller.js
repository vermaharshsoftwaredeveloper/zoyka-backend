import { asyncHandler } from "../../utils/async-handler/index.js";
import ApiError from "../../utils/api-error/index.js";
import * as settingService from "./admin-setting.service.js";
import { createSettingSchema, updateSettingSchema } from "./admin-setting.validation.js";

const parseBody = (schema, body) => {
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message);
    return parsed.data;
};

export const getAllSettings = asyncHandler(async (req, res) => {
    const data = await settingService.getAllSettingsService(req.query.category);
    res.status(200).json({ success: true, data });
});

export const getSettingByKey = asyncHandler(async (req, res) => {
    const data = await settingService.getSettingByKeyService(req.params.key);
    res.status(200).json({ success: true, data });
});

export const createSetting = asyncHandler(async (req, res) => {
    const payload = parseBody(createSettingSchema, req.body);
    const data = await settingService.createSettingService(payload);
    res.status(201).json({ success: true, message: "Setting created", data });
});

export const updateSettingByKey = asyncHandler(async (req, res) => {
    const payload = parseBody(updateSettingSchema, req.body);
    const data = await settingService.updateSettingByKeyService(req.params.key, payload);
    res.status(200).json({ success: true, message: "Setting updated", data });
});

export const deleteSettingByKey = asyncHandler(async (req, res) => {
    await settingService.deleteSettingByKeyService(req.params.key);
    res.status(200).json({ success: true, message: "Setting deleted successfully" });
});