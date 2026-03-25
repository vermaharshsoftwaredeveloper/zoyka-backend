import { Router } from "express";
import { getCustomerReviewHighlights } from "./review.controller.js";

const router = Router();

router.get("/highlights", getCustomerReviewHighlights);

export default router;
