import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { createReview, listReviewsByProduct } from "./review.controller.js";

const router = Router({ mergeParams: true });

router.get("/", listReviewsByProduct);
router.post("/", requireAuth, createReview);

export default router;
