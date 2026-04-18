import crypto from "crypto";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";
import { createInvoiceForOrder } from "../invoice/invoice.service.js";
import { validateCouponService, incrementCouponUsage } from "../coupon/coupon.service.js";
import {
  CASHFREE_APP_ID,
  CASHFREE_ENVIRONMENT,
  CASHFREE_SECRET_KEY,
  FRONTEND_BASE_URL,
  FRONTEND_BASE_URL2,
  DASHBOARD_BASE_URL,
  DASHBOARD_BASE_URL2,
} from "../../config/env.js";

const ORDER_STATUS_TIMELINE = [
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const toOrderCard = (order) => {
  return {
    id: order.id,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentSessionId: order.paymentSessionId,
    quantity: order.quantity,
    unitPrice: order.unitPrice,
    totalAmount: order.totalAmount,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    product: order.product,
    address: order.address,
    tracking: {
      currentStatus: order.status,
      availableStatuses: ORDER_STATUS_TIMELINE,
      lastUpdatedAt: order.updatedAt,
    },
  };
};

const getCashfreeBaseUrl = () => {
  return CASHFREE_ENVIRONMENT === "production"
    ? "https://api.cashfree.com"
    : "https://sandbox.cashfree.com";
};

const getCashfreeHeaders = () => {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    throw new ApiError(500, "Cashfree configuration is missing on the server.");
  }

  return {
    "Content-Type": "application/json",
    "x-api-version": "2023-08-01",
    "x-client-id": CASHFREE_APP_ID,
    "x-client-secret": CASHFREE_SECRET_KEY,
  };
};

const createCashfreeOrder = async ({ orderId, amount, customerDetails, returnUrl }) => {
  // Build customer details object - include all available values
  const customerDetailsObj = {
    customer_id: String(customerDetails.id),
    customer_name: customerDetails.name,
    customer_phone: customerDetails.phone,
  };

  // Add email - this is important for fraud detection (Sardine)
  if (customerDetails.email) {
    customerDetailsObj.customer_email = customerDetails.email;
  }

  const payload = {
    order_id: orderId,
    order_amount: Number(amount.toFixed(2)),
    order_currency: "INR",
    customer_details: customerDetailsObj,
    order_meta: {
      return_url: returnUrl,
      notify_url: `${FRONTEND_BASE_URL.replace(/\/$/, "")}/api/payment/webhook`, // Optional webhook
    },
  };

  const url = `${getCashfreeBaseUrl()}/pg/orders`;
  const headers = getCashfreeHeaders();

  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  // Check if the order was created successfully
  // Cashfree returns order_status: "ACTIVE" for successful orders
  if (!response.ok || !data.order_id || data.order_status !== "ACTIVE") {
    throw new ApiError(
      502,
      data.message || data.error_description || "Cashfree order creation failed"
    );
  }

  return {
    paymentSessionId: data.payment_session_id,
    cashfreeOrderId: data.order_id,
  };
};

const fetchCashfreeOrderStatus = async (orderId) => {
  const response = await fetch(`${getCashfreeBaseUrl()}/pg/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: getCashfreeHeaders(),
  });

  const data = await response.json();

  // Cashfree returns order details directly, no status field for error checking
  if (!response.ok || !data.order_id) {
    throw new ApiError(
      502,
      data.message || data.error_description || "Unable to verify Cashfree payment status"
    );
  }

  return data;
};

const ensureAddressOwnership = async ({ userId, addressId }) => {
  const address = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId,
    },
  });

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  return address;
};

const getUserCartWithItems = async (userId) => {
  return prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              sellingPrice: true,
              stock: true,
            },
          },
        },
      },
    },
  });
};

const mapPaymentMethod = (paymentMethod) => {
  if (paymentMethod === "card") return "CARD";
  if (paymentMethod === "upi") return "UPI";
  return "COD";
};

export const checkoutCartService = async ({ userId, addressId, paymentMethod = "cod", notes, couponCode }) => {
  const address = await ensureAddressOwnership({ userId, addressId });

  // Fetch user details for customer information
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, mobile: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const cart = await getUserCartWithItems(userId);

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  const outOfStockItem = cart.items.find((item) => item.quantity > item.product.stock);

  if (outOfStockItem) {
    throw new ApiError(400, `${outOfStockItem.product.title} has insufficient stock`);
  }

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.quantity * item.product.sellingPrice,
    0
  );

  // Validate coupon server-side if provided
  let couponDiscount = 0;
  let validatedCouponCode = null;

  if (couponCode) {
    const couponResult = await validateCouponService({ code: couponCode, subtotal });
    couponDiscount = couponResult.discount;
    validatedCouponCode = couponResult.code;
  }

  // Shipping: free above ₹499, else ₹50 (matches invoice service constants)
  const SHIPPING_THRESHOLD = 499;
  const SHIPPING_CHARGE = 50;
  const shippingCharge = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;

  const totalAmount = Math.max(0, subtotal - couponDiscount + shippingCharge);

  const safePaymentMethod = mapPaymentMethod(paymentMethod);

  if (safePaymentMethod === "COD") {
    const createdOrders = await prisma.$transaction(async (tx) => {
      const orders = [];
      let remainingDiscount = couponDiscount;

      for (let i = 0; i < cart.items.length; i++) {
        const item = cart.items[i];
        const itemSubtotal = item.quantity * item.product.sellingPrice;

        // Split coupon discount proportionally across items
        let itemDiscount = 0;
        if (couponDiscount > 0 && subtotal > 0) {
          if (i === cart.items.length - 1) {
            // Last item gets remaining to avoid rounding issues
            itemDiscount = remainingDiscount;
          } else {
            itemDiscount = Math.round((itemSubtotal / subtotal) * couponDiscount * 100) / 100;
            remainingDiscount -= itemDiscount;
          }
        }

        const orderTotal = Math.max(0, itemSubtotal - itemDiscount);

        const order = await tx.order.create({
          data: {
            userId,
            addressId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.sellingPrice,
            totalAmount: orderTotal,
            notes,
            status: "PLACED",
            paymentMethod: "COD",
            paymentStatus: "NOT_REQUIRED",
          },
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: "asc" }, take: 1 },
                outlet: { select: { id: true, key: true, name: true } },
              },
            },
            address: true,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        await createInvoiceForOrder(tx, {
          order,
          couponCode: validatedCouponCode,
          couponDiscount: itemDiscount,
        });

        orders.push(order);
      }

      // Increment coupon usage after successful order
      if (validatedCouponCode) {
        await incrementCouponUsage(tx, validatedCouponCode);
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return orders;
    });

    return { order: createdOrders.map(toOrderCard) };
  }

  const sessionId = crypto.randomUUID();
  const returnUrl = `${FRONTEND_BASE_URL.replace(/\/$/, "")}/payment-result?sessionId=${sessionId}`;

  const customerDetails = {
    id: userId,
    name: address.fullName || user.name,
    email: user.email, // Use user's email from database
    phone: address.phoneNumber || user.mobile,
  };

  console.log("📋 Checkout Customer Details:", {
    fromAddress: {
      fullName: address.fullName,
      phoneNumber: address.phoneNumber,
    },
    fromUser: {
      name: user.name,
      mobile: user.mobile,
    },
    finalCustomerDetails: customerDetails,
  });

  const cashfreeOrder = await createCashfreeOrder({
    orderId: sessionId,
    amount: totalAmount,
    customerDetails,
    returnUrl,
  });

  const createdOrders = await prisma.$transaction(async (tx) => {
    const paymentSession = await tx.paymentSession.create({
      data: {
        id: sessionId,
        userId,
        addressId,
        amount: totalAmount,
        currency: "INR",
        paymentMethod: safePaymentMethod,
        status: "PENDING",
        cashfreeOrderId: cashfreeOrder.cashfreeOrderId,
        notes,
      },
    });

    const orders = [];
    let remainingDiscount = couponDiscount;

    for (let i = 0; i < cart.items.length; i++) {
      const item = cart.items[i];
      const itemSubtotal = item.quantity * item.product.sellingPrice;

      let itemDiscount = 0;
      if (couponDiscount > 0 && subtotal > 0) {
        if (i === cart.items.length - 1) {
          itemDiscount = remainingDiscount;
        } else {
          itemDiscount = Math.round((itemSubtotal / subtotal) * couponDiscount * 100) / 100;
          remainingDiscount -= itemDiscount;
        }
      }

      const orderTotal = Math.max(0, itemSubtotal - itemDiscount);

      const order = await tx.order.create({
        data: {
          userId,
          addressId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.product.sellingPrice,
          totalAmount: orderTotal,
          notes,
          status: "PAYMENT_PENDING",
          paymentMethod: safePaymentMethod,
          paymentStatus: "PENDING",
          paymentSessionId: paymentSession.id,
        },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });

      await createInvoiceForOrder(tx, {
        order,
        couponCode: validatedCouponCode,
        couponDiscount: itemDiscount,
      });

      orders.push(order);
    }

    if (validatedCouponCode) {
      await incrementCouponUsage(tx, validatedCouponCode);
    }

    // Don't delete cart items yet - only delete after payment success
    // await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return { orders, cartId: cart.id };
  });

  return {
    paymentSessionId: cashfreeOrder.paymentSessionId,
    cashfreeSessionId: sessionId,
    amount: totalAmount,
    currency: "INR",
    cartId: createdOrders.cartId,
  };
};

export const confirmCashfreePaymentService = async ({ userId, paymentSessionId }) => {
  const session = await prisma.paymentSession.findUnique({
    where: { id: paymentSessionId },
    include: { orders: true },
  });

  if (!session || session.userId !== userId) {
    throw new ApiError(404, "Payment session not found");
  }

  if (session.status === "SUCCESS") {
    const orders = await prisma.order.findMany({
      where: { paymentSessionId: session.id },
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: "asc" }, take: 1 },
            outlet: { select: { id: true, key: true, name: true } },
          },
        },
        address: true,
      },
    });

    return {
      status: "SUCCESS",
      orders: orders.map(toOrderCard),
    };
  }

  if (!session.cashfreeOrderId) {
    throw new ApiError(400, "Missing Cashfree payment reference");
  }

  const statusResponse = await fetchCashfreeOrderStatus(session.cashfreeOrderId);
  const orderStatus = (statusResponse.order_status || statusResponse.payment_status || "").toString().toUpperCase();

  if (["PAID", "COMPLETED", "SUCCESS"].includes(orderStatus)) {
    await prisma.$transaction(async (tx) => {
      // Re-check status inside transaction to prevent race with webhook
      const freshSession = await tx.paymentSession.findUnique({
        where: { id: session.id },
        select: { status: true },
      });
      if (freshSession.status === "SUCCESS") return; // Already processed by webhook

      await tx.paymentSession.update({
        where: { id: session.id },
        data: { status: "SUCCESS" },
      });

      await tx.order.updateMany({
        where: { paymentSessionId: session.id },
        data: { status: "PLACED", paymentStatus: "SUCCESS" },
      });

      // Now delete cart items after successful payment
      const firstOrder = session.orders[0];
      if (firstOrder?.userId) {
        const cart = await tx.cart.findUnique({
          where: { userId: firstOrder.userId },
        });
        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
      }
    }, {
      maxWait: 10000, // Maximum time to wait for transaction to start (10 seconds)
      timeout: 10000, // Maximum execution time (10 seconds)
    });

    // Fetch orders outside transaction (read-only operation doesn't need transactional guarantee)
    const confirmedOrders = await prisma.order.findMany({
      where: { paymentSessionId: session.id },
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: "asc" }, take: 1 },
            outlet: { select: { id: true, key: true, name: true } },
          },
        },
        address: true,
      },
    });

    return {
      status: "SUCCESS",
      orders: confirmedOrders.map(toOrderCard),
    };
  }

  if (["FAILED", "CANCELLED", "EXPIRED"].includes(orderStatus)) {
    await prisma.$transaction(async (tx) => {
      // Re-check status inside transaction to prevent race with webhook
      const freshSession = await tx.paymentSession.findUnique({
        where: { id: session.id },
        select: { status: true },
      });
      if (freshSession.status === "FAILED" || freshSession.status === "SUCCESS") return;

      await tx.paymentSession.update({
        where: { id: session.id },
        data: { status: "FAILED" },
      });

      await tx.order.updateMany({
        where: { paymentSessionId: session.id },
        data: { status: "CANCELLED", paymentStatus: "FAILED" },
      });

      for (const order of session.orders) {
        await tx.product.update({
          where: { id: order.productId },
          data: { stock: { increment: order.quantity } },
        });
      }
    }, {
      maxWait: 10000,
      timeout: 10000,
    });

    throw new ApiError(400, "Payment failed or was cancelled");
  }

  return {
    status: "PENDING",
    message: "Payment is still pending. Please complete it or retry.",
  };
};

export const listOrdersService = async (userId) => {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
          outlet: {
            select: {
              id: true,
              key: true,
              name: true,
            },
          },
        },
      },
      address: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map(toOrderCard);
};

export const getOrderByIdService = async ({ userId, orderId }) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      product: {
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
          },
          outlet: {
            select: {
              id: true,
              key: true,
              name: true,
            },
          },
        },
      },
      address: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return toOrderCard(order);
};
