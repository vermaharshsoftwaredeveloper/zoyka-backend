import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.middleware.js";
import {
  createAdminOutlet,
  deleteAdminOutlet,
  getAdminOutletById,
  listAdminOutlets,
  updateAdminOutlet,
} from "./admin-outlet.controller.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/", listAdminOutlets);
router.get("/:outletId", getAdminOutletById);
router.post("/", createAdminOutlet);
router.patch("/:outletId", updateAdminOutlet);
router.delete("/:outletId", deleteAdminOutlet);

export default router;
