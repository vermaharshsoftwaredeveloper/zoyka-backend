# Cashfree Payment Gateway Setup & Integration Guide

## ✅ Completed Implementation

This backend now has a **complete Cashfree payment integration** with:

### 1. **Payment Module Files** (`src/modules/payment/`)
- ✅ `cashfree.js` - Client library with API functions
- ✅ `cashfree.controller.js` - Webhook and verification endpoints  
- ✅ `payment.routes.js` - Route definitions

### 2. **Key Features Implemented**

#### A. Order Creation & Payment Initiation
**Endpoint**: `POST /api/orders/checkout`
- Creates order with PaymentSession
- Generates Cashfree payment link
- Deducts stock (reserves inventory)
- Supports: COD, Card (CARD), UPI

**Request**:
```json
{
  "addressId": "address_uuid",
  "paymentMethod": "card",
  "notes": "Optional order notes"
}
```

**Response**:
```json
{
  "paymentUrl": "https://cashfree.com/payment/...",
  "paymentSessionId": "session_uuid",
  "amount": 5000,
  "currency": "INR"
}
```

#### B. Webhook Endpoint (Real-time Updates)
**Endpoint**: `POST /api/payments/webhook/payment`
- Receives payment status from Cashfree
- No authentication required (IP-whitelisted by Cashfree)
- Verifies HMAC-SHA256 signature
- Updates PaymentSession and Order status
- Handles stock restoration on failure

**Webhook Events Handled**:
- `PAYMENT_SUCCESS_WEBHOOK` → Updates to SUCCESS status
- `PAYMENT_FAILED_WEBHOOK` → Updates to FAILED, restores stock
- `PAYMENT_CANCELLED_WEBHOOK` → Treats as failed

#### C. Manual Payment Verification (Frontend Polling)
**Endpoint**: `POST /api/payments/verify` (Requires authentication)
- Called by frontend after returning from Cashfree
- Queries Cashfree for current payment status
- Updates database accordingly
- Returns payment confirmation and order details

**Request**:
```json
{
  "paymentSessionId": "session_uuid"
}
```

**Response**:
```json
{
  "status": "SUCCESS|PENDING|FAILED",
  "message": "Payment successful",
  "paymentSession": {
    "id": "session_uuid",
    "amount": 5000,
    "currency": "INR",
    "status": "SUCCESS"
  }
}
```

#### D. Webhook Health Check
**Endpoint**: `GET /api/payments/webhook/health`
- Status: ✅ Endpoint operational
- Use to verify webhook server is running

---

## 🔧 Setup Instructions

### Step 1: Register with Cashfree

1. Visit: https://dashboard.cashfree.com
2. Sign up as a merchant
3. Complete KYC verification
4. Navigate to: **Settings** → **API Keys**
5. Copy:
   - **App ID** (x-client-id)
   - **Secret Key** (x-client-secret)

### Step 2: Add Credentials to .env

```bash
CASHFREE_ENVIRONMENT="sandbox"        # Use "production" for live
CASHFREE_APP_ID="your_app_id_here"
CASHFREE_SECRET_KEY="your_secret_key_here"
FRONTEND_BASE_URL="http://localhost:5173"
```

### Step 3: Configure Webhook in Cashfree Dashboard

1. In Cashfree Dashboard: **Settings** → **Webhooks**
2. Add Webhook URL:
   - **Sandbox**: `http://your-backend-domain/api/payments/webhook/payment`
   - **Production**: `https://your-backend-domain/api/payments/webhook/payment`

3. Select Events:
   - ✅ PAYMENT_SUCCESS_WEBHOOK
   - ✅ PAYMENT_FAILED_WEBHOOK
   - ✅ PAYMENT_CANCELLED_WEBHOOK
   - ✅ PAYMENT_EXPIRED_WEBHOOK

4. Save & Test Webhook

### Step 4: Whitelist Backend IP (Optional)

In Cashfree Settings: Add your backend server's IP to webhook whitelist for security.

---

## 📊 Payment Flow Diagram

```
Customer Checkout
    ↓
POST /api/orders/checkout (COD or Card/UPI)
    ↓
[COD] → Create orders with status PLACED
    ↓
[Card/UPI] → Create PaymentSession
             Generate Cashfree payment link
             Redirect customer to Cashfree
    ↓
Customer completes payment on Cashfree
    ↓
[Option A] Cashfree sends webhook
           POST /api/payments/webhook/payment
           ↓
           Update PaymentSession & Orders
           ↓
[Option B] Frontend polls after redirect
           POST /api/payments/verify
           ↓
           Verify with Cashfree API
           ↓
           Update PaymentSession & Orders
    ↓
Frontend shows order confirmation
Customer receives order notification
```

---

## 🔐 Security Features

### 1. **Webhook Signature Verification**
- Uses HMAC-SHA256 signature from `X-Webhook-Signature` header
- Constant-time comparison to prevent timing attacks
- Invalid signatures rejected with 403 Forbidden

### 2. **Database Transactions**
- All payment updates wrapped in transactions
- Atomic stock restoration on payment failure
- Prevents state inconsistencies

### 3. **Handshake Authentication**
- All API endpoints require `HANDSHAKE_KEY` header
- Defined in env: `HANDSHAKE_KEY`

### 4. **JWT Authentication**
- Verify endpoints require valid JWT token
- Prevents unauthorized access to payment data

---

## 📱 Frontend Integration

### Checkout Flow

```javascript
// 1. User clicks "Proceed to Payment"
const response = await axios.post('/api/orders/checkout', {
  addressId: 'address_id',
  paymentMethod: 'card', // or 'upi', 'cod'
  notes: 'Optional notes'
});

const { paymentUrl, paymentSessionId } = response.data.data;

// 2. Redirect to Cashfree
if (paymentUrl) {
  window.location.href = paymentUrl;
}
```

### After Payment (Return from Cashfree)

```javascript
// Redirect to: /payment-result?sessionId={sessionId}

// 3. Verify payment status
const verifyResponse = await axios.post('/api/payments/verify', {
  paymentSessionId: sessionId
});

const { status } = verifyResponse.data;

if (status === 'SUCCESS') {
  // Show order confirmation
  // Redirect to /my-orders
} else if (status === 'FAILED') {
  // Show error message
  // Allow retry
} else {
  // Payment pending - ask user to refresh
}
```

### Error Handling

```javascript
try {
  const response = await axios.post('/api/orders/checkout', {...});
  // Process response
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error - show to user
  } else if (error.response?.status === 500) {
    // Server error - Cashfree credentials missing
  }
}
```

---

## 🧪 Testing Payments

### Sandbox Credentials (for testing)

Cashfree provides test cards in their documentation:
- **Test Success Card**: 4111 1111 1111 1111
- **Test Failed Card**: 4222 2222 2222 2222
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### Test Flow

1. Start backend: `pnpm run dev`
2. Start frontend: `npm run dev`
3. Add products to cart
4. Checkout with test card
5. Complete payment
6. Verify order appears in `/my-orders`

---

## 🚨 Troubleshooting

### "Cashfree configuration is missing"
- **Solution**: Add CASHFREE_APP_ID and CASHFREE_SECRET_KEY to .env

### Webhook not receiving events
- **Solution**: 
  1. Verify webhook URL in Cashfree dashboard
  2. Check backend IP is whitelisted (if required)
  3. Ensure backend is publicly accessible
  4. Check /api/payments/webhook/health returns 200

### Payment stuck in PENDING status
- **Solution**: 
  1. Customer can call `/api/payments/verify` to update status
  2. Check payment status in Cashfree dashboard
  3. Manual database update if necessary

### Stock not restoring after failed payment
- **Solution**: 
  1. Webhook must be processed
  2. Check payment session status in database
  3. Manually restore stock if needed:
     ```sql
     UPDATE "Product" SET stock = stock + quantity 
     WHERE id IN (SELECT "productId" FROM "Order" 
     WHERE "paymentSessionId" = 'session_id');
     ```

---

## 📋 Database Schema

### PaymentSession Model
```
id                  String (UUID)      - Unique session ID
userId              String             - User who initiated payment
addressId           String             - Delivery address
amount              Float              - Total order amount
currency            String             - "INR"
paymentMethod       Enum               - CARD, UPI, COD
status              Enum               - PENDING, SUCCESS, FAILED
cashfreeOrderId     String             - Cashfree order ID (unique)
cashfreeOrderToken  String             - Session token from Cashfree
cashfreePaymentLink String             - Payment page URL
cartItems           JSON               - Product details snapshot
notes               String             - Order notes
createdAt           DateTime           - Session creation time
updatedAt           DateTime           - Last update time
```

### Order Model (Updated)
```
paymentSessionId    String (FK)        - Links to PaymentSession
paymentStatus       Enum               - NOT_REQUIRED, PENDING, SUCCESS, FAILED
paymentMethod       Enum               - COD, CARD, UPI
```

---

## 🔄 Production Deployment

### Before Going Live

1. **Get Production Credentials**
   - Switch to production in Cashfree dashboard
   - Copy production App ID & Secret Key

2. **Update .env**
   ```
   CASHFREE_ENVIRONMENT="production"
   CASHFREE_APP_ID="live_app_id"
   CASHFREE_SECRET_KEY="live_secret_key"
   FRONTEND_BASE_URL="https://yourdomain.com"
   ```

3. **Configure Webhook**
   - Update webhook URL to production domain
   - Test webhook delivery

4. **SSL Certificate**
   - Ensure HTTPS enabled
   - Required for production payments

5. **Security Audit**
   - Verify HANDSHAKE_KEY is strong
   - Enable IP whitelisting if available
   - Review webhook signature verification

6. **Testing**
   - Test with production credentials (small amount)
   - Verify webhook integration
   - Test error handling

---

## 📞 Support

- **Cashfree Support**: https://support.cashfree.com
- **API Documentation**: https://docs.cashfree.com
- **Dashboard**: https://dashboard.cashfree.com

---

## ✨ Summary

Your Zoyka backend now has:

✅ Complete Cashfree payment flow
✅ Webhook handlers for real-time updates
✅ Manual payment verification
✅ Stock management with reservations
✅ Transaction safety with database atomicity
✅ Signature verification for webhook security
✅ Production-ready error handling
✅ Comprehensive logging

**Next Steps**: Add Cashfree credentials to .env and test the payment flow!
