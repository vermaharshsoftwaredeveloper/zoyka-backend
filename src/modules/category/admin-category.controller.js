import { asyncHandler } from "../../utils/async-handler/index.js";
import ApiError from "../../utils/api-error/index.js";
import * as adminCategoryService from "./admin-category.service.js";
import { createCategorySchema, updateCategorySchema } from "./admin-category.validation.js";

const parseBody = (schema, body) => {
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message);
    return parsed.data;
};

export const getAllCategoriesAdmin = asyncHandler(async (req, res) => {
    const categories = await adminCategoryService.getAllCategoriesAdminService();
    res.status(200).json({ success: true, data: categories });
});

export const createCategory = asyncHandler(async (req, res) => {
    const payload = parseBody(createCategorySchema, req.body);
    const newCategory = await adminCategoryService.createCategoryService(payload);
    res.status(201).json({ success: true, message: "Category created", data: newCategory });
});

export const updateCategory = asyncHandler(async (req, res) => {
    const payload = parseBody(updateCategorySchema, req.body);
    const updatedCategory = await adminCategoryService.updateCategoryService(req.params.id, payload);
    res.status(200).json({ success: true, message: "Category updated", data: updatedCategory });
});

export const toggleCategoryStatus = asyncHandler(async (req, res) => {
    const updatedCategory = await adminCategoryService.toggleCategoryStatusService(req.params.id);
    res.status(200).json({ success: true, message: `Category is now ${updatedCategory.isActive ? 'Active' : 'Inactive'}` });
});

export const deleteCategory = asyncHandler(async (req, res) => {
    await adminCategoryService.deleteCategoryService(req.params.id);
    res.status(200).json({ success: true, message: "Category deleted successfully" });
});