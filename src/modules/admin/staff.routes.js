import { Router } from "express";
import {
  getOperationalManagers,
  addOperationalManager,
  updateOperationalManager,
  deleteOperationalManager,
} from "./staff.controller.js";
import { requireAuth, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, authorizeRoles("ADMIN"));

router.get("/managers", getOperationalManagers);
router.post("/managers", addOperationalManager);
router.patch("/managers/:managerId", updateOperationalManager);
router.delete("/managers/:managerId", deleteOperationalManager);

export default router;