import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";
import { asyncHandler } from "../../utils/async-handler/index.js";
import {
  verifyWebhookSignature,
  parseWebhookData,
  getOrderStatus,
} from "./cashfree.js";

/**
 * Handle Cashfree webhook notifications
 * Updates payment status and order status based on payment events
 */
export const handlePaymentWebhook = asyncHandler(async (req, res) => {
  const webhookData = req.body;
  const signature = req.headers["x-webhook-signature"];

  if (!signature) {
    throw new ApiError(400, "Missing webhook signature");
  }

  // Verify webhook signature to ensure it's from Cashfree
  try {
    const isValid = verifyWebhookSignature(JSON.stringify(webhookData), signature);
    if (!isValid) {
      throw new ApiError(403, "Invalid webhook signature");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Webhook verification error:", error);
    throw new ApiError(403, "Webhook verification failed");
  }

  // Parse webhook data
  const parsedData = parseWebhookData(webhookData);
  const { orderId, orderStatus, paymentStatus, paymentMethod, paymentTime } = parsedData.data;

  if (!orderId) {
    throw new ApiError(400, "Missing order ID in webhook data");
  }

  // Find payment session
  const paymentSession = await prisma.paymentSession.findUnique({
    where: { cashfreeOrderId: orderId },
    include: { orders: true },
  });

  if (!paymentSession) {
    // Log webhook but don't fail - might be a duplicate or old webhook
    console.warn(`Payment session not found for Cashfree order: ${orderId}`);
    return res.status(200).json({
      status: "success",
      message: "Webhook received but payment session not found",
    });
  }

  // Idempotency check: if already processed, skip
  if (paymentSession.status === "SUCCESS" || paymentSession.status === "FAILED") {
    return res.status(200).json({
      status: "success",
      message: "Payment already processed",
      orderId,
    });
  }

  // Determine if payment was successful
  const isPaymentSuccess =
    orderStatus === "PAID" ||
    paymentStatus === "SUCCESS" ||
    paymentStatus === "PAID" ||
    orderStatus === "COMPLETED";

  const isPaymentFailed =
    orderStatus === "FAILED" ||
    paymentStatus === "FAILED" ||
    orderStatus === "CANCELLED" ||
    paymentStatus === "CANCELLED";

  // Update payment session and orders
  await prisma.$transaction(async (tx) => {
    if (isPaymentSuccess) {
      // Payment successful
      await tx.paymentSession.update({
        where: { id: paymentSession.id },
        data: {
          status: "SUCCESS",
          updatedAt: new Date(),
        },
      });

      // Update all orders associated with this payment session
      await tx.order.updateMany({
        where: { paymentSessionId: paymentSession.id },
        data: {
          status: "PLACED",
          paymentStatus: "SUCCESS",
        },
      });

      // Delete cart items after successful payment
      const firstOrder = paymentSession.orders[0];
      if (firstOrder?.userId) {
        const cart = await tx.cart.findUnique({
          where: { userId: firstOrder.userId },
        });
        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
      }
    } else if (isPaymentFailed) {
      // Payment failed - reverse stock reservations
      await tx.paymentSession.update({
        where: { id: paymentSession.id },
        data: { status: "FAILED" },
      });

      await tx.order.updateMany({
        where: { paymentSessionId: paymentSession.id },
        data: {
          status: "CANCELLED",
          paymentStatus: "FAILED",
        },
      });

      // Restore product stock
      for (const order of paymentSession.orders) {
        await tx.product.update({
          where: { id: order.productId },
          data: { stock: { increment: order.quantity } },
        });
      }
    }
  }, {
    maxWait: 10000, // Maximum time to wait for transaction to start (10 seconds)
    timeout: 10000, // Maximum execution time (10 seconds)
  });

  // Return success response to Cashfree
  res.status(200).json({
    status: "success",
    message: `Payment ${isPaymentSuccess ? "successful" : isPaymentFailed ? "failed" : "pending"}`,
    orderId,
    paymentSessionId: paymentSession.id,
  });
});

/**
 * Health check for webhook endpoint
 */
export const webhookHealth = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Webhook endpoint is running",
    endpoint: "/api/webhooks/cashfree/payment",
  });
});

/**
 * Manual payment verification (for frontend polling)
 * Called by frontend after customer returns from Cashfree payment page
 */
export const verifyPaymentStatus = asyncHandler(async (req, res) => {
  const { paymentSessionId } = req.body;

  if (!paymentSessionId) {
    throw new ApiError(400, "Payment session ID is required");
  }

  const paymentSession = await prisma.paymentSession.findUnique({
    where: { id: paymentSessionId },
    include: {
      orders: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
              outlet: { select: { id: true, key: true, name: true } },
            },
          },
          address: true,
        },
      },
    },
  });

  if (!paymentSession || !paymentSession.cashfreeOrderId) {
    throw new ApiError(404, "Payment session not found");
  }

  // If already processed, return cached result
  if (paymentSession.status === "SUCCESS" || paymentSession.status === "FAILED") {
    return res.status(200).json({
      status: paymentSession.status,
      message:
        paymentSession.status === "SUCCESS"
          ? "Payment successful"
          : "Payment failed or cancelled",
      orders: paymentSession.orders,
      paymentSession: {
        id: paymentSession.id,
        amount: paymentSession.amount,
        currency: paymentSession.currency,
        status: paymentSession.status,
        createdAt: paymentSession.createdAt,
      },
    });
  }

  // Verify status with Cashfree
  try {
    const orderStatus = await getOrderStatus(paymentSession.cashfreeOrderId);

    const isSuccess =
      orderStatus.paymentStatus === "SUCCESS" ||
      orderStatus.paymentStatus === "PAID" ||
      orderStatus.orderStatus === "PAID";

    const isFailed =
      orderStatus.paymentStatus === "FAILED" ||
      orderStatus.paymentStatus === "CANCELLED";

    if (isSuccess || isFailed) {
      // Update session status
      await prisma.paymentSession.update({
        where: { id: paymentSession.id },
        data: { status: isSuccess ? "SUCCESS" : "FAILED" },
      });

      if (isSuccess) {
        // Update orders
        await prisma.order.updateMany({
          where: { paymentSessionId: paymentSession.id },
          data: { status: "PLACED", paymentStatus: "SUCCESS" },
        });
      } else {
        // Restore stock on failure
        await prisma.order.updateMany({
          where: { paymentSessionId: paymentSession.id },
          data: { status: "CANCELLED", paymentStatus: "FAILED" },
        });

        for (const order of paymentSession.orders) {
          await prisma.product.update({
            where: { id: order.productId },
            data: { stock: { increment: order.quantity } },
          });
        }
      }
    }

    res.status(200).json({
      status: isSuccess ? "SUCCESS" : isFailed ? "FAILED" : "PENDING",
      paymentStatus: orderStatus.paymentStatus,
      message: isSuccess ? "Payment confirmed" : isFailed ? "Payment failed" : "Payment pending",
      paymentSession: {
        id: paymentSession.id,
        amount: paymentSession.amount,
        currency: paymentSession.currency,
        paymentMethod: orderStatus.paymentMethod,
      },
    });
  } catch (error) {
    console.error("Error verifying payment with Cashfree:", error);

    res.status(200).json({
      status: "PENDING",
      message: "Payment status could not be verified. Please try again.",
      paymentSessionId,
    });
  }
});
