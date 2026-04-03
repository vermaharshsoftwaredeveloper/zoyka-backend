import { Router } from "express";
import {
    getAllCategoriesAdmin,
    createCategory,
    updateCategory,
    toggleCategoryStatus,
    deleteCategory
} from "./admin-category.controller.js";
import { requireAuth, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, authorizeRoles("ADMIN", "MANAGER", "SUPER_ADMIN"));

router.get("/", getAllCategoriesAdmin);
router.post("/", createCategory);
router.patch("/:id", updateCategory);
router.patch("/:id/toggle-status", toggleCategoryStatus);
router.delete("/:id", deleteCategory);

export default router;