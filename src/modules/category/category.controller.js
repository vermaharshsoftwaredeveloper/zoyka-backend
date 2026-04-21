import { asyncHandler } from "../../utils/async-handler/index.js";
import { getAllCategoriesService, getAllDeptCategoriesService } from "./category.service.js";

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await getAllCategoriesService();

  res.status(200).json({
    message: "Categories fetched successfully",
    data: categories,
  });
});


export const getCategoriesByDepartment = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;

  const categories = await getAllDeptCategoriesService(departmentId);

  res.status(200).json({
    success: true,
    message: "Categories fetched successfully",
    data: categories,
  });
});