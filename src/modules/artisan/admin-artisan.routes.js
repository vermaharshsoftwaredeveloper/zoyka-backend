import { Router } from "express";
import {
    getAllArtisansAdmin,
    createArtisan,
    updateArtisan,
    deleteArtisan,
    toggleArtisanStatus,
    getArtisanById,
    checkUser
} from "./admin-artisan.controller.js";
import { requireAuth, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, authorizeRoles("ADMIN", "MANAGER"));

router.get("/", getAllArtisansAdmin);
router.get("/check-user", checkUser);
router.post("/", createArtisan);
router.get("/:id", getArtisanById);
router.patch("/:id", updateArtisan);
router.patch("/:id/toggle-status", toggleArtisanStatus);
router.delete("/:id", deleteArtisan);

export default router;