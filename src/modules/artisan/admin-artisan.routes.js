import { Router } from "express";
import {
    getAllArtisansAdmin,
    createArtisan,
    updateArtisan,
    toggleArtisanStatus,
    getArtisanById
} from "./admin-artisan.controller.js";
import { requireAuth, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, authorizeRoles("ADMIN", "MANAGER"));

router.get("/", getAllArtisansAdmin);
router.post("/", createArtisan);
router.get("/:id", getArtisanById);
router.patch("/:id", updateArtisan);
router.patch("/:id/toggle-status", toggleArtisanStatus);

export default router;