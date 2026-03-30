import { asyncHandler } from "../../utils/async-handler/index.js";
import { getAllCategoriesService } from "./category.service.js";

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await getAllCategoriesService();

  res.status(200).json({
    message: "Categories fetched successfully",
    data: categories,
  });
});
