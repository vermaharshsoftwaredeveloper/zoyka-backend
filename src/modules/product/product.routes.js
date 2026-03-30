import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
	getCategoryBestsellers,
	getProductById,
	getTopPicksForUser,
	listProducts,
} from "./product.controller.js";

const router = Router();

router.get("/", listProducts);
router.get("/bestsellers", getCategoryBestsellers);
router.get("/top-picks", requireAuth, getTopPicksForUser);
router.get("/:productId", getProductById);

export default router;
