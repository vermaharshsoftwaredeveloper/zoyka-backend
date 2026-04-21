import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.middleware.js";
import {
  getAdminProductById,
  listAdminProducts,
} from "./admin-product.controller.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/", listAdminProducts);
router.get("/:productId", getAdminProductById);

export default router;
