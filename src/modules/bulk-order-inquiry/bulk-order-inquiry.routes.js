import { Router } from "express";
import {
  createBulkOrderInquiry,
  getAllBulkOrderInquiries,
  getBulkOrderInquiryById,
  updateBulkOrderInquiry,
  deleteBulkOrderInquiry,
} from "./bulk-order-inquiry.controller.js";
import { requireAuth, authorizeRoles } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, createBulkOrderInquiry);
router.get("/", requireAuth, authorizeRoles("ADMIN", "MANAGER"), getAllBulkOrderInquiries);
router.get("/:id", requireAuth, authorizeRoles("ADMIN", "MANAGER"), getBulkOrderInquiryById);
router.patch("/:id", requireAuth, authorizeRoles("ADMIN", "MANAGER"), updateBulkOrderInquiry);
router.delete("/:id", requireAuth, authorizeRoles("ADMIN"), deleteBulkOrderInquiry);

export default router;
