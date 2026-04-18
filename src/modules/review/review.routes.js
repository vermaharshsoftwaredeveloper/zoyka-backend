import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { createReview, listReviewsByProduct, getMyReview, updateReview } from "./review.controller.js";

const router = Router({ mergeParams: true });

router.get("/", listReviewsByProduct);
router.get("/me", requireAuth, getMyReview);
router.post("/", requireAuth, createReview);
router.put("/:reviewId", requireAuth, updateReview);

export default router;
