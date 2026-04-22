import { sendEmail } from "./email.service.js";

const BRAND_COLOR = "#FF9F1C";
const BRAND_COLOR_DARK = "#E8880A";
const BRAND_NAME = "Zoykah";
const FRONTEND_URL = process.env.FRONTEND_BASE_URL || "https://zoyka.in";

/**
 * Base layout wrapper — gives every email the same premium look.
 */
const baseLayout = ({ previewText, bodyContent }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${previewText}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #f4f4f5; font-family: 'Inter', Arial, sans-serif; color: #1a1a2e; }
    a { color: inherit; text-decoration: none; }
    img { border: 0; display: block; }
  </style>
</head>
<body style="background:#f4f4f5;margin:0;padding:0;">
  <!-- Preheader hidden text -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f4f4f5;">${previewText}</div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <!-- Card -->
        <table width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0" role="presentation">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND_COLOR} 0%,${BRAND_COLOR_DARK} 100%);border-radius:16px 16px 0 0;padding:36px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <span style="font-size:30px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
                      Zoy<span style="color:rgba(255,255,255,0.7);">kah</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1a1a2e;border-radius:0 0 16px 16px;padding:28px 40px;text-align:center;">
              <p style="color:rgba(255,255,255,0.5);font-size:12px;line-height:1.6;margin-bottom:8px;">
                © ${new Date().getFullYear()} ${BRAND_NAME}. Authentic Handmade Products &amp; Artisan Crafts.
              </p>
              <p style="color:rgba(255,255,255,0.3);font-size:11px;">
                You're receiving this email because you placed an order with us.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Renders a status badge pill.
 */
const statusBadge = (label, bgColor, textColor = "#fff") =>
  `<span style="display:inline-block;background:${bgColor};color:${textColor};font-size:12px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;padding:5px 14px;border-radius:20px;">${label}</span>`;

/**
 * Renders the product summary block.
 */
const productBlock = ({ title, quantity, unitPrice, totalAmount, productImage }) => `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:#fafafa;border:1px solid #eeeeee;border-radius:12px;padding:20px;margin:24px 0;">
    <tr>
      ${productImage ? `<td width="72" style="padding-right:16px;vertical-align:top;">
        <img src="${productImage}" alt="${title}" width="72" height="72"
             style="border-radius:10px;object-fit:cover;width:72px;height:72px;" />
      </td>` : ""}
      <td style="vertical-align:top;">
        <p style="font-size:15px;font-weight:600;color:#1a1a2e;margin-bottom:4px;line-height:1.4;">${title}</p>
        <p style="font-size:13px;color:#6b7280;margin-bottom:2px;">Qty: <strong style="color:#1a1a2e;">${quantity}</strong></p>
        <p style="font-size:13px;color:#6b7280;">Unit price: <strong style="color:#1a1a2e;">₹${Number(unitPrice).toLocaleString("en-IN")}</strong></p>
      </td>
      <td style="vertical-align:top;text-align:right;white-space:nowrap;">
        <p style="font-size:18px;font-weight:700;color:${BRAND_COLOR};">₹${Number(totalAmount).toLocaleString("en-IN")}</p>
      </td>
    </tr>
  </table>
`;

/**
 * Renders the delivery address block.
 */
const addressBlock = (address) => {
  if (!address) return "";
  const parts = [
    address.fullName,
    address.line1,
    address.line2,
    address.landmark,
    [address.district, address.state].filter(Boolean).join(", "),
    address.pincode,
  ].filter(Boolean);

  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background:#f9fafb;border-left:3px solid ${BRAND_COLOR};border-radius:0 8px 8px 0;padding:16px 20px;margin-top:20px;">
      <tr>
        <td>
          <p style="font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#9ca3af;margin-bottom:8px;">Delivery Address</p>
          ${parts.map((p) => `<p style="font-size:13px;color:#374151;line-height:1.7;">${p}</p>`).join("")}
        </td>
      </tr>
    </table>
  `;
};

/**
 * CTA button
 */
const ctaButton = (label, url) => `
  <table cellpadding="0" cellspacing="0" role="presentation" style="margin:28px auto 0;">
    <tr>
      <td style="border-radius:10px;background:linear-gradient(135deg,${BRAND_COLOR} 0%,${BRAND_COLOR_DARK} 100%);">
        <a href="${url}" target="_blank"
           style="display:inline-block;color:#fff;font-size:14px;font-weight:700;letter-spacing:0.3px;padding:14px 32px;text-decoration:none;">
          ${label}
        </a>
      </td>
    </tr>
  </table>
`;

// ─────────────────────────────────────────────────────────────────────────────
// Template builders
// ─────────────────────────────────────────────────────────────────────────────

const buildOrderConfirmedHtml = ({ customerName, orderId, product, address }) => {
  const body = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:#fff7ed;border-radius:50%;margin-bottom:16px;">
        <span style="font-size:28px;">✅</span>
      </div>
      <h1 style="font-size:24px;font-weight:800;color:#1a1a2e;margin-bottom:8px;">Order Confirmed!</h1>
      <p style="font-size:15px;color:#6b7280;line-height:1.6;">
        Hey ${customerName}, we've received your order and our artisan team is preparing it with care.
      </p>
    </div>

    ${statusBadge("Order Confirmed", "#16a34a")}

    ${productBlock(product)}
    ${addressBlock(address)}

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:20px;">
      <tr>
        <td style="background:#fff7ed;border-radius:10px;padding:16px 20px;">
          <p style="font-size:13px;color:#92400e;line-height:1.6;">
            🎨 <strong>Handcrafted with love.</strong> Every Zoykah product is made by skilled artisans.
            Your order typically ships within <strong>2–3 business days</strong>.
          </p>
        </td>
      </tr>
    </table>

    ${ctaButton("Track My Order", `${FRONTEND_URL}/myaccount`)}

    <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:24px;">
      Order ID: <strong style="color:#374151;">#${orderId}</strong>
    </p>
  `;

  return baseLayout({
    previewText: `Your Zoykah order #${orderId} is confirmed! 🎉`,
    bodyContent: body,
  });
};

const buildOrderShippedHtml = ({ customerName, orderId, product, address }) => {
  const body = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:#eff6ff;border-radius:50%;margin-bottom:16px;">
        <span style="font-size:28px;">🚚</span>
      </div>
      <h1 style="font-size:24px;font-weight:800;color:#1a1a2e;margin-bottom:8px;">Your Order Is On Its Way!</h1>
      <p style="font-size:15px;color:#6b7280;line-height:1.6;">
        Great news, ${customerName}! Your package has been handed over to our delivery partner and is en route to you.
      </p>
    </div>

    ${statusBadge("Shipped", "#2563eb")}

    ${productBlock(product)}
    ${addressBlock(address)}

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:20px;">
      <tr>
        <td style="background:#eff6ff;border-radius:10px;padding:16px 20px;">
          <p style="font-size:13px;color:#1e40af;line-height:1.6;">
            📦 <strong>Stay home!</strong> Our delivery partner will attempt delivery during business hours.
            Please keep your phone reachable for delivery updates.
          </p>
        </td>
      </tr>
    </table>

    ${ctaButton("View Order Details", `${FRONTEND_URL}/myaccount`)}

    <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:24px;">
      Order ID: <strong style="color:#374151;">#${orderId}</strong>
    </p>
  `;

  return baseLayout({
    previewText: `Your Zoykah order #${orderId} has been shipped! 🚚`,
    bodyContent: body,
  });
};

const buildOrderDeliveredHtml = ({ customerName, orderId, product }) => {
  const body = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:#f0fdf4;border-radius:50%;margin-bottom:16px;">
        <span style="font-size:28px;">🎁</span>
      </div>
      <h1 style="font-size:24px;font-weight:800;color:#1a1a2e;margin-bottom:8px;">Delivered! Enjoy Your Treasure.</h1>
      <p style="font-size:15px;color:#6b7280;line-height:1.6;">
        ${customerName}, your handcrafted order has been delivered. We hope you love it as much as the artisan loved making it!
      </p>
    </div>

    ${statusBadge("Delivered", "#16a34a")}

    ${productBlock(product)}

    <!-- Review CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="background:linear-gradient(135deg,#fff7ed 0%,#fef3c7 100%);border-radius:12px;padding:24px;margin-top:24px;text-align:center;">
      <tr>
        <td>
          <p style="font-size:22px;margin-bottom:8px;">⭐⭐⭐⭐⭐</p>
          <p style="font-size:15px;font-weight:700;color:#92400e;margin-bottom:6px;">How was your experience?</p>
          <p style="font-size:13px;color:#b45309;margin-bottom:20px;line-height:1.6;">
            Your review helps our artisans reach more customers and motivates them to keep creating.
          </p>
          ${ctaButton("Write a Review", `${FRONTEND_URL}/myaccount`)}
        </td>
      </tr>
    </table>

    <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:28px;">
      Order ID: <strong style="color:#374151;">#${orderId}</strong>
    </p>
  `;

  return baseLayout({
    previewText: `Your Zoykah order #${orderId} has been delivered! Share your review 🎁`,
    bodyContent: body,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Public send functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send "Order Confirmed" email.
 * @param {object} order - Full order object from Prisma (with user, product, address)
 */
export const sendOrderConfirmedEmail = async (order) => {
  if (!order?.user?.email) return;
  try {
    await sendEmail({
      email: order.user.email,
      subject: `✅ Order Confirmed – Your Zoykah order #${order.id} is being prepared`,
      html: buildOrderConfirmedHtml({
        customerName: order.user.name || "Valued Customer",
        orderId: order.id,
        product: {
          title: order.product?.title || "Your Item",
          quantity: order.quantity,
          unitPrice: order.unitPrice,
          totalAmount: order.totalAmount,
          productImage: order.product?.images?.[0]?.url
            ? order.product.images[0].url.startsWith("http")
              ? order.product.images[0].url
              : null
            : null,
        },
        address: order.address,
      }),
    });
  } catch (err) {
    console.error("Failed to send order confirmed email:", err);
  }
};

/**
 * Send "Order Shipped" email.
 */
export const sendOrderShippedEmail = async (order) => {
  if (!order?.user?.email) return;
  try {
    await sendEmail({
      email: order.user.email,
      subject: `🚚 Your Zoykah order #${order.id} has been shipped!`,
      html: buildOrderShippedHtml({
        customerName: order.user.name || "Valued Customer",
        orderId: order.id,
        product: {
          title: order.product?.title || "Your Item",
          quantity: order.quantity,
          unitPrice: order.unitPrice,
          totalAmount: order.totalAmount,
          productImage: order.product?.images?.[0]?.url
            ? order.product.images[0].url.startsWith("http")
              ? order.product.images[0].url
              : null
            : null,
        },
        address: order.address,
      }),
    });
  } catch (err) {
    console.error("Failed to send order shipped email:", err);
  }
};

/**
 * Send "Order Delivered" email.
 */
export const sendOrderDeliveredEmail = async (order) => {
  if (!order?.user?.email) return;
  try {
    await sendEmail({
      email: order.user.email,
      subject: `🎁 Your Zoykah order #${order.id} has been delivered!`,
      html: buildOrderDeliveredHtml({
        customerName: order.user.name || "Valued Customer",
        orderId: order.id,
        product: {
          title: order.product?.title || "Your Item",
          quantity: order.quantity,
          unitPrice: order.unitPrice,
          totalAmount: order.totalAmount,
          productImage: order.product?.images?.[0]?.url
            ? order.product.images[0].url.startsWith("http")
              ? order.product.images[0].url
              : null
            : null,
        },
      }),
    });
  } catch (err) {
    console.error("Failed to send order delivered email:", err);
  }
};
