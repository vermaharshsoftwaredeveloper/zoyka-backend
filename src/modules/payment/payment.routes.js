import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { paymentLimiter } from "../../middleware/rate-limit.middleware.js";
import {
  handlePaymentWebhook,
  webhookHealth,
  verifyPaymentStatus,
} from "./cashfree.controller.js";

const router = Router();

/**
 * Webhook endpoint (no authentication needed - called by Cashfree servers)
 * Signature verified via X-Webhook-Signature header
 */
router.post("/webhook/payment", handlePaymentWebhook);

/**
 * Health check for webhook endpoint
 */
router.get("/webhook/health", webhookHealth);

/**
 * Manual payment verification by frontend (requires authentication)
 * Called after customer returns from Cashfree payment page
 */
router.post("/verify", requireAuth, paymentLimiter, verifyPaymentStatus);

export default router;
