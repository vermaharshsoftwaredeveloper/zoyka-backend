import { Router } from "express";
import { getFinanceDashboard } from "./admin-finance.controller.js";
import { requireAuth, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, authorizeRoles("ADMIN", "MANAGER"));

router.get("/dashboard", getFinanceDashboard);

export default router;