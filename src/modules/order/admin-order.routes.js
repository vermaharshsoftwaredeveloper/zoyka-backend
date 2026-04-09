import { Router } from "express";
import { getAllOrdersAdmin, getOrderByIdAdmin } from "./admin-order.controller.js";
import { requireAuth, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, authorizeRoles("ADMIN", "MANAGER"));

router.get("/", getAllOrdersAdmin);
router.get("/:id", getOrderByIdAdmin);

export default router;