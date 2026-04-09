import { Router } from "express";
import {
    getAllRegionsAdmin,
    createRegion,
    updateRegion,
    toggleRegionStatus,
    deleteRegion
} from "./admin-region.controller.js";
import { requireAuth, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, authorizeRoles("ADMIN"));

router.get("/", getAllRegionsAdmin);
router.post("/", createRegion);
router.patch("/:id", updateRegion);
router.patch("/:id/toggle-status", toggleRegionStatus);
router.delete("/:id", deleteRegion);

export default router;