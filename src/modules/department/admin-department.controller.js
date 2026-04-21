import { asyncHandler } from "../../utils/async-handler/index.js";
import ApiError from "../../utils/api-error/index.js";
import * as adminDepartmentService from "./admin-department.service.js";
import { createDepartmentSchema, updateDepartmentSchema } from "./admin-department.validation.js";

const parseBody = (schema, body) => {
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message);
    return parsed.data;
};

export const getAllDepartmentsAdmin = asyncHandler(async (req, res) => {
    const departments = await adminDepartmentService.getAllDepartmentsAdminService();
    res.status(200).json({ success: true, data: departments });
});

export const createDepartment = asyncHandler(async (req, res) => {
    const payload = parseBody(createDepartmentSchema, req.body);
    const newDepartment = await adminDepartmentService.createDepartmentService(payload);
    res.status(201).json({ success: true, message: "Department created", data: newDepartment });
});

export const updateDepartment = asyncHandler(async (req, res) => {
    const payload = parseBody(updateDepartmentSchema, req.body);
    const updatedDepartment = await adminDepartmentService.updateDepartmentService(req.params.id, payload);
    res.status(200).json({ success: true, message: "Department updated", data: updatedDepartment });
});

export const toggleDepartmentStatus = asyncHandler(async (req, res) => {
    const updatedDepartment = await adminDepartmentService.toggleDepartmentStatusService(req.params.id);
    res.status(200).json({ success: true, message: `Department is now ${updatedDepartment.isActive ? 'Active' : 'Inactive'}` });
});

export const deleteDepartment = asyncHandler(async (req, res) => {
    await adminDepartmentService.deleteDepartmentService(req.params.id);
    res.status(200).json({ success: true, message: "Department deleted successfully" });
});