import { Router } from "express";
import {
    getAllDepartmentsAdmin,
    createDepartment,
    updateDepartment,
    toggleDepartmentStatus,
    deleteDepartment
} from "./admin-department.controller.js";
import { requireAuth, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, authorizeRoles("ADMIN", "MANAGER"));

router.get("/", getAllDepartmentsAdmin);
router.post("/", createDepartment);
router.patch("/:id", updateDepartment);
router.patch("/:id/toggle-status", toggleDepartmentStatus);
router.delete("/:id", deleteDepartment);

export default router;