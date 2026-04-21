import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { paymentLimiter } from "../../middleware/rate-limit.middleware.js";
import { checkoutCart, confirmPayment, getOrderById, listOrders } from "./order.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/checkout", paymentLimiter, checkoutCart);
router.post("/payment/confirm", paymentLimiter, confirmPayment);
router.get("/", listOrders);
router.get("/:orderId", getOrderById);

export default router;
