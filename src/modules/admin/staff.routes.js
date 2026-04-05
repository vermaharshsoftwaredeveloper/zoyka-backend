import { Router } from "express";
import { getOperationalManagers, addOperationalManager } from "./staff.controller.js";
import { requireAuth, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, authorizeRoles("ADMIN"));

router.get("/managers", getOperationalManagers);
router.post("/managers", addOperationalManager);

export default router;