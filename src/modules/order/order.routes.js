import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { checkoutCart, getOrderById, listOrders } from "./order.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/checkout", checkoutCart);
router.get("/", listOrders);
router.get("/:orderId", getOrderById);

export default router;
