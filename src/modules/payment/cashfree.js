import crypto from "crypto";
import { CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENVIRONMENT } from "../../config/env.js";
import ApiError from "../../utils/api-error/index.js";

/**
 * Cashfree Payment Gateway Integration
 * Handles payment order creation, status verification, and webhook validation
 */

export const getBaseUrl = () => {
  return CASHFREE_ENVIRONMENT === "production"
    ? "https://api.cashfree.com"
    : "https://sandbox.cashfree.com";
};

export const getHeaders = () => {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    throw new ApiError(500, "Cashfree credentials are not configured");
  }

  return {
    "Content-Type": "application/json",
    "x-api-version": "2023-08-01",
    "x-client-id": CASHFREE_APP_ID,
    "x-client-secret": CASHFREE_SECRET_KEY,
  };
};

/**
 * Create an order in Cashfree
 */
export const createOrder = async (orderPayload) => {
  try {
    const url = `${getBaseUrl()}/pg/orders`;
    const headers = getHeaders();

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();

    // Check if the order was created successfully
    // Cashfree returns order_status: "ACTIVE" for successful orders
    if (!response.ok || !data.order_id || data.order_status !== "ACTIVE") {
      throw new ApiError(
        502,
        data.message || data.error_description || "Failed to create Cashfree order"
      );
    }

    // Generate payment link from payment_session_id
    // Format: https://sandbox.cashfree.com/pay/<payment_session_id>
    const baseUrl = getBaseUrl();
    const paymentLink = `${baseUrl}/pay/${data.payment_session_id}`;

    return {
      paymentLink: paymentLink,
      orderToken: data.payment_session_id ?? null,
      cashfreeOrderId: data.order_id,
      status: "OK",
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, `Cashfree API Error: ${error.message}`);
  }
};

/**
 * Fetch order status from Cashfree
 */
export const getOrderStatus = async (orderId) => {
  try {
    const response = await fetch(`${getBaseUrl()}/pg/orders/${encodeURIComponent(orderId)}`, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!response.ok || !data.order_id) {
      throw new ApiError(
        502,
        data.message || data.error_description || "Failed to fetch order status"
      );
    }

    return {
      orderId: data.order_id,
      orderAmount: data.order_amount,
      orderCurrency: data.order_currency,
      orderStatus: data.order_status,
      paymentStatus: data.payment_status || data.order_status,
      paymentMethod: data.payment_method,
      customerEmail: data.customer_details?.customer_email,
      transactionId: data.cf_payment_id,
      createdAt: data.order_expiry_time || data.created_at,
      paymentTime: data.payment_time,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, `Failed to verify payment: ${error.message}`);
  }
};

/**
 * Verify webhook signature from Cashfree
 * Cashfree sends: X-Webhook-Signature header with HMAC-SHA256 signature
 */
export const verifyWebhookSignature = (payload, signature) => {
  if (!CASHFREE_SECRET_KEY) {
    throw new ApiError(500, "Cashfree secret key not configured");
  }

  // Convert payload object to string if needed
  const payloadString = typeof payload === "string" ? payload : JSON.stringify(payload);

  // Generate HMAC-SHA256 signature
  const expectedSignature = crypto
    .createHmac("sha256", CASHFREE_SECRET_KEY)
    .update(payloadString)
    .digest("base64");

  // Compare signatures (constant-time comparison to prevent timing attacks)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

/**
 * Parse webhook event data
 */
export const parseWebhookData = (data) => {
  return {
    eventId: data.event_id,
    eventType: data.event_type, // PAYMENT_SUCCESS_WEBHOOK, PAYMENT_FAILED_WEBHOOK
    eventTime: data.event_time,
    data: {
      orderId: data.data?.order?.order_id,
      orderAmount: data.data?.order?.order_amount,
      orderStatus: data.data?.order?.order_status,
      paymentStatus: data.data?.payment?.payment_status,
      paymentMethod: data.data?.payment?.payment_method,
      paymentTime: data.data?.payment?.payment_time,
      cardNetwork: data.data?.payment?.card_network,
      bankName: data.data?.payment?.bank_name,
      authorizationId: data.data?.payment?.auth_id,
    },
  };
};
