import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { getMyProfile, updateMyProfile } from "./user-profile.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/me", getMyProfile);
router.patch("/me", updateMyProfile);

export default router;
