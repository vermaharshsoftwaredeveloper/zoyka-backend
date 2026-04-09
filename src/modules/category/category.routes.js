import { Router } from "express";
import { getCategories,getCategoriesByDepartment } from "./category.controller.js";

const router = Router();
router.get("/department/:departmentId", getCategoriesByDepartment);
router.get("/", getCategories);

export default router;
