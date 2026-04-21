import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.middleware.js";
import {
  createAdminTestimonial,
  deleteAdminTestimonial,
  getAdminTestimonialById,
  listAdminTestimonials,
  updateAdminTestimonial,
} from "./admin-testimonial.controller.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/", listAdminTestimonials);
router.get("/:testimonialId", getAdminTestimonialById);
router.post("/", createAdminTestimonial);
router.patch("/:testimonialId", updateAdminTestimonial);
router.delete("/:testimonialId", deleteAdminTestimonial);

export default router;
