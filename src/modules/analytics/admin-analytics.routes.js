import { Router } from "express";
import { getAnalyticsDashboard } from "./admin-analytics.controller.js";
import { requireAuth, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, authorizeRoles("ADMIN", "MANAGER"));

router.get("/", getAnalyticsDashboard);

export default router;