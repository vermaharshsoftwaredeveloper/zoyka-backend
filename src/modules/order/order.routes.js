import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { checkoutCart, confirmPayment, getOrderById, listOrders } from "./order.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/checkout", checkoutCart);
router.post("/payment/confirm", confirmPayment);
router.get("/", listOrders);
router.get("/:orderId", getOrderById);

export default router;
