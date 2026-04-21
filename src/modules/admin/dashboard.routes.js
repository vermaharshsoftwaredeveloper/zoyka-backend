import { Router } from "express";
import { getDashboardMetrics } from "./dashboard.controller.js";
import { requireAuth, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/dashboard", requireAuth, authorizeRoles("ADMIN", "MANAGER"), getDashboardMetrics);

export default router;