import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
	getDepartmentBestsellers,
	getFilterOptions,
	getOutletBestsellers,
	getProductById,
	getSimilarProducts,
	getTopPicksForUser,
	listProducts,
} from "./product.controller.js";

const router = Router();

router.get("/", listProducts);
router.get("/filters", getFilterOptions);
router.get("/bestsellers/department/:departmentId", getDepartmentBestsellers);
router.get("/bestsellers/outlet/:outletId", getOutletBestsellers);
router.get("/top-picks", getTopPicksForUser);
router.get("/:productId", getProductById);
router.get("/:productId/similar", getSimilarProducts);

export default router;
