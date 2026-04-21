import { Router } from "express";
import {
    getAllOutletsAdmin,
    createOutlet,
    updateOutlet,
    deleteOutlet,
    toggleOutletStatus,
    getOutletById
} from "./admin-outlet.controller.js";
import { requireAuth, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, authorizeRoles("ADMIN", "MANAGER"));

router.get("/", getAllOutletsAdmin);
router.post("/", createOutlet);
router.get("/:id", getOutletById);
router.patch("/:id", updateOutlet);
router.patch("/:id/toggle-status", toggleOutletStatus);
router.delete("/:id", deleteOutlet);

export default router;