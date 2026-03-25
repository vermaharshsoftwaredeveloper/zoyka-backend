import { Router } from "express";
import { getOperationalManagers } from "./staff.controller.js";
import { requireAuth, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, authorizeRoles("ADMIN"));

router.get("/managers", getOperationalManagers);

export default router;