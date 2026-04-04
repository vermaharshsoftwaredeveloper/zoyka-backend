// src/modules/department/department.controller.js

import { asyncHandler } from "../../utils/async-handler/index.js";
import * as departmentService from "./department.service.js";

export const getAllDepartments = asyncHandler(async (req, res) => {
  const data = await departmentService.getAllDepartmentsService();

  res.status(200).json({
    success: true,
    message: "Departments fetched successfully",
    data,
  });
});