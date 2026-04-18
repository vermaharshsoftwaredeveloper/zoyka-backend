import crypto from "crypto";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";
import {
  CASHFREE_APP_ID,
  CASHFREE_ENVIRONMENT,
  CASHFREE_SECRET_KEY,
  FRONTEND_BASE_URL,
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
    "x-client-id": CASHFREE_APP_ID,
    "x-client-secret": CASHFREE_SECRET_KEY,
  };
};

const createCashfreeOrder = async ({ orderId, amount, customerDetails, returnUrl }) => {
  const payload = {
    order_id: orderId,
    order_amount: Number(amount.toFixed(2)),
    order_currency: "INR",
    order_note: "Zoyka order payment",
    customer_details: {
      customer_id: customerDetails.id,
      customer_name: customerDetails.name,
      customer_email: customerDetails.email || undefined,
      customer_phone: customerDetails.phone,
    },
    return_url: returnUrl,
  };

  const response = await fetch(`${getCashfreeBaseUrl()}/pg/orders`, {
    method: "POST",
    headers: getCashfreeHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || (data.status !== "OK" && data.status !== "SUCCESS")) {
    throw new ApiError(
      502,
      data.message || data.error_description || "Cashfree order creation failed"
    );
  }

  return {
    paymentLink: data.payment_link,
    orderToken: data.order_token ?? null,
    cashfreeOrderId: data.order_id ?? orderId,
  };
};

const fetchCashfreeOrderStatus = async (orderId) => {
  const response = await fetch(`${getCashfreeBaseUrl()}/pg/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: getCashfreeHeaders(),
  });

  const data = await response.json();

  if (!response.ok || (data.status !== "OK" && data.status !== "SUCCESS")) {
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

export const checkoutCartService = async ({ userId, addressId, paymentMethod = "cod", notes }) => {
  const address = await ensureAddressOwnership({ userId, addressId });

  const cart = await getUserCartWithItems(userId);

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  const outOfStockItem = cart.items.find((item) => item.quantity > item.product.stock);

  if (outOfStockItem) {
    throw new ApiError(400, `${outOfStockItem.product.title} has insufficient stock`);
  }

  const totalAmount = cart.items.reduce(
    (sum, item) => sum + item.quantity * item.product.sellingPrice,
    0
  );

  const safePaymentMethod = mapPaymentMethod(paymentMethod);

  if (safePaymentMethod === "COD") {
    const createdOrders = await prisma.$transaction(async (tx) => {
      const orders = [];

      for (const item of cart.items) {
        const order = await tx.order.create({
          data: {
            userId,
            addressId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.sellingPrice,
            totalAmount: item.quantity * item.product.sellingPrice,
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

        orders.push(order);
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
    name: address.fullName,
    email: undefined,
    phone: address.phoneNumber,
  };

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
        cashfreeOrderToken: cashfreeOrder.orderToken,
        cashfreePaymentLink: cashfreeOrder.paymentLink,
        notes,
        cartItems: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.product.sellingPrice,
        })),
      },
    });

    const orders = [];

    for (const item of cart.items) {
      const order = await tx.order.create({
        data: {
          userId,
          addressId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.product.sellingPrice,
          totalAmount: item.quantity * item.product.sellingPrice,
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

      orders.push(order);
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return orders;
  });

  return {
    paymentUrl: cashfreeOrder.paymentLink,
    paymentSessionId: sessionId,
    amount: totalAmount,
    currency: "INR",
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
    const confirmedOrders = await prisma.$transaction(async (tx) => {
      await tx.paymentSession.update({
        where: { id: session.id },
        data: { status: "SUCCESS" },
      });

      await tx.order.updateMany({
        where: { paymentSessionId: session.id },
        data: { status: "PLACED", paymentStatus: "SUCCESS" },
      });

      return tx.order.findMany({
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
    });

    return {
      status: "SUCCESS",
      orders: confirmedOrders.map(toOrderCard),
    };
  }

  if (["FAILED", "CANCELLED", "EXPIRED"].includes(orderStatus)) {
    await prisma.$transaction(async (tx) => {
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
