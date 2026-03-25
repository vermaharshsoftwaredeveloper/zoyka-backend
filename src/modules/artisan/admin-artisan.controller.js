import { asyncHandler } from "../../utils/async-handler/index.js";
import ApiError from "../../utils/api-error/index.js";
import * as adminArtisanService from "./admin-artisan.service.js";
import { createArtisanSchema, updateArtisanSchema, getArtisansQuerySchema } from "./admin-artisan.validation.js";

const parseSchema = (schema, data) => {
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message);
    return parsed.data;
};

export const getAllArtisansAdmin = asyncHandler(async (req, res) => {
    const filters = parseSchema(getArtisansQuerySchema, req.query);
    const artisans = await adminArtisanService.getAllArtisansAdminService(filters);
    res.status(200).json({ success: true, data: artisans });
});

export const createArtisan = asyncHandler(async (req, res) => {
    const payload = parseSchema(createArtisanSchema, req.body);
    const newArtisan = await adminArtisanService.createArtisanService(payload);
    res.status(201).json({ success: true, message: "Artisan created successfully", data: newArtisan });
});

export const updateArtisan = asyncHandler(async (req, res) => {
    const payload = parseSchema(updateArtisanSchema, req.body);
    const updatedArtisan = await adminArtisanService.updateArtisanService(req.params.id, payload);
    res.status(200).json({ success: true, message: "Artisan updated successfully", data: updatedArtisan });
});

export const toggleArtisanStatus = asyncHandler(async (req, res) => {
    const updatedArtisan = await adminArtisanService.toggleArtisanStatusService(req.params.id);
    res.status(200).json({ success: true, message: `Artisan is now ${updatedArtisan.isActive ? 'Active' : 'Inactive'}` });
});

export const getArtisanById = asyncHandler(async (req, res) => {
    const artisan = await adminArtisanService.getArtisanByIdAdminService(req.params.id);
    res.status(200).json({ success: true, data: artisan });
});