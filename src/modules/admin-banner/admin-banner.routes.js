import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.middleware.js";
import {
  createAdminBanner,
  deleteAdminBanner,
  getAdminBannerById,
  listAdminBanners,
  updateAdminBanner,
} from "./admin-banner.controller.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/", listAdminBanners);
router.get("/:bannerId", getAdminBannerById);
router.post("/", createAdminBanner);
router.patch("/:bannerId", updateAdminBanner);
router.delete("/:bannerId", deleteAdminBanner);

export default router;
