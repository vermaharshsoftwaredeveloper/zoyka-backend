import prisma from "../../config/prisma.js";
import ApiError from "../../utils/api-error/index.js";

const GST_RATE = 0; // Set to 18 for 18% GST, 0 if not applicable
const SHIPPING_THRESHOLD = 499; // Free shipping above this amount
const SHIPPING_CHARGE = 50;

const generateInvoiceNumber = () => {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${y}${m}${d}-${rand}`;
};

/**
 * Create invoice for an order (called internally during checkout)
 */
export const createInvoiceForOrder = async (tx, { order, couponCode, couponDiscount }) => {
  const productPrice = order.unitPrice;
  const quantity = order.quantity;
  const subtotal = productPrice * quantity;
  const shippingCharge = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const discount = couponDiscount || 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const gstPercent = GST_RATE;
  const gstAmount = Number(((afterDiscount * gstPercent) / 100).toFixed(2));
  const totalAmount = Number((afterDiscount + gstAmount + shippingCharge).toFixed(2));

  return tx.invoice.create({
    data: {
      orderId: order.id,
      invoiceNumber: generateInvoiceNumber(),
      userId: order.userId,
      productPrice,
      quantity,
      subtotal,
      shippingCharge,
      gstPercent,
      gstAmount,
      couponCode: couponCode || null,
      couponDiscount: discount,
      totalAmount,
    },
  });
};

/**
 * Get invoice by order ID (for user)
 */
export const getInvoiceByOrderIdService = async ({ userId, orderId }) => {
  const invoice = await prisma.invoice.findUnique({
    where: { orderId },
    include: {
      order: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
          },
          address: true,
        },
      },
    },
  });

  if (!invoice || invoice.userId !== userId) {
    throw new ApiError(404, "Invoice not found");
  }

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    createdAt: invoice.createdAt,
    breakdown: {
      productPrice: invoice.productPrice,
      quantity: invoice.quantity,
      subtotal: invoice.subtotal,
      shippingCharge: invoice.shippingCharge,
      gstPercent: invoice.gstPercent,
      gstAmount: invoice.gstAmount,
      couponCode: invoice.couponCode,
      couponDiscount: invoice.couponDiscount,
      totalAmount: invoice.totalAmount,
    },
    order: {
      id: invoice.order.id,
      status: invoice.order.status,
      paymentMethod: invoice.order.paymentMethod,
      paymentStatus: invoice.order.paymentStatus,
      createdAt: invoice.order.createdAt,
      product: invoice.order.product,
      address: invoice.order.address,
    },
  };
};

/**
 * List all invoices for a user
 */
export const listInvoicesService = async (userId) => {
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    include: {
      order: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    totalAmount: inv.totalAmount,
    createdAt: inv.createdAt,
    orderId: inv.orderId,
    productTitle: inv.order?.product?.title,
    productImage: inv.order?.product?.images?.[0]?.url,
  }));
};
