# CASHFREE PAYMENT GATEWAY - SETUP COMPLETION GUIDE

## Status: IMPLEMENTATION COMPLETE - READY FOR FINAL CONFIGURATION

Your backend now has a fully implemented Cashfree payment system. To complete the setup and enable actual payment processing, follow these steps:

---

## STEP-BY-STEP SETUP (5-10 minutes)

### STEP 1: Register with Cashfree
```
1. Go to: https://dashboard.cashfree.com
2. Click "Sign Up Now"
3. Enter your details (name, email, password)
4. Verify your email
5. Complete KYC verification (may take a few hours or days)
```

### STEP 2: Get Sandbox App Credentials
```
1. Log into Cashfree Dashboard
2. Click "Settings" in sidebar
3. Click "API Keys"
4. You'll see:
   - App ID (x-client-id)
   - Client Secret (x-client-secret)
   - Environment: Sandbox
5. Copy both values
```

### STEP 3: Update .env File
**File:** `zoyka-backend/.env`

Find these lines:
```
CASHFREE_APP_ID="TEST_APP_ID"
CASHFREE_SECRET_KEY="TEST_SECRET_KEY"
```

Replace with your actual credentials:
```
CASHFREE_APP_ID="your_actual_app_id"
CASHFREE_SECRET_KEY="your_actual_secret_key"
```

**Save the file.** Backend will auto-reload via nodemon.

### STEP 4: Configure Webhook in Cashfree Dashboard
```
1. In Cashfree Dashboard, click "Settings"
2. Click "Webhooks"
3. Click "Add Webhook"
4. Enter these details:
   
   Webhook URL:
   http://localhost:3001/api/payments/webhook/payment
   
   Events (check all):
   ☑ PAYMENT_SUCCESS_WEBHOOK
   ☑ PAYMENT_FAILED_WEBHOOK
   ☑ PAYMENT_CANCELLED_WEBHOOK
   ☑ PAYMENT_EXPIRED_WEBHOOK

5. Click "Save"
6. Click "Test Webhook" button
7. You should see: "Webhook delivered successfully"
```

### STEP 5: Test Payment Flow

**Terminal 1 - Start Backend:**
```bash
cd zoyka-backend
pnpm run dev
```
Wait for: "Server is running on port 3001"

**Terminal 2 - Start Frontend:**
```bash
cd zoyka-frontend/zoyka-frontend
npm run dev
```
Visit: http://localhost:5173

**In Browser - Test Payment:**
```
1. Add products to cart
2. Go to Checkout
3. Select payment method: "Card"
4. Click "Proceed to Payment"
5. Use Cashfree test card:
   - Card Number: 4111 1111 1111 1111
   - CVV: 123
   - Expiry: 12/25 (any future date)
6. Click "Pay"
7. Should redirect back to app
8. Check "My Orders" - order should appear
9. Order status should be: PLACED
10. Payment status should be: SUCCESS
```

---

## WHAT YOU NOW HAVE

✅ **Real-time Webhook Processing**
- Cashfree sends payment notifications
- Backend processes them in real-time
- Orders and payment status update automatically
- Stock is restored if payment fails

✅ **Manual Verification Fallback**
- If webhooks don't arrive, frontend can poll status
- POST /api/payments/verify endpoint
- Syncs payment status with Cashfree

✅ **Security**
- HMAC-SHA256 signature verification
- JWT authentication
- Database transaction safety
- Automatic stock reversal on failure

✅ **Multiple Payment Methods**
- COD (Cash on Delivery)
- Card (Credit/Debit)
- UPI

---

## TROUBLESHOOTING

**Problem: "Cashfree configuration is missing"**
- Ensure CASHFREE_APP_ID and CASHFREE_SECRET_KEY in .env are NOT "TEST_APP_ID"
- Restart backend after updating .env

**Problem: Webhook not working**
- Verify webhook URL in Cashfree dashboard matches exactly
- Click "Test Webhook" in Cashfree to verify connectivity
- Check backend is running and publicly accessible (for remote testing)

**Problem: Payment status stuck in PENDING**
- Webhook may not have arrived
- Frontend can call /api/payments/verify to manually sync
- Check Cashfree dashboard for payment status

---

## API ENDPOINTS AVAILABLE

### 1. Initiate Checkout
```
POST /api/orders/checkout
Headers: 
  x-api-key: <HANDSHAKE_KEY>
  Authorization: Bearer <JWT_TOKEN>

Body:
{
  "addressId": "uuid",
  "paymentMethod": "card",  // or "cod", "upi"
  "notes": "optional"
}

Response:
{
  "paymentUrl": "https://cashfree.com/...",
  "paymentSessionId": "uuid",
  "amount": 5000,
  "currency": "INR"
}
```

### 2. Verify Payment (Manual)
```
POST /api/payments/verify
Headers:
  x-api-key: <HANDSHAKE_KEY>
  Authorization: Bearer <JWT_TOKEN>

Body:
{
  "paymentSessionId": "uuid"
}

Response:
{
  "status": "SUCCESS|PENDING|FAILED",
  "paymentStatus": "SUCCESS|PENDING|FAILED",
  "paymentSession": {...}
}
```

### 3. Webhook (from Cashfree)
```
POST /api/payments/webhook/payment
Headers:
  X-Webhook-Signature: <HMAC_SIGNATURE>

Body: (Cashfree webhook payload)
```

### 4. Health Check
```
GET /api/payments/webhook/health

Response:
{
  "status": "ok",
  "message": "Webhook endpoint is running"
}
```

---

## PRODUCTION DEPLOYMENT CHECKLIST

When ready to go live:

- [ ] Register for production Cashfree account (different from sandbox)
- [ ] Get production App ID and Secret Key
- [ ] Update .env:
  ```
  CASHFREE_ENVIRONMENT="production"
  CASHFREE_APP_ID="live_app_id"
  CASHFREE_SECRET_KEY="live_secret_key"
  FRONTEND_BASE_URL="https://yourdomain.com"
  ```
- [ ] Configure production webhook URL in Cashfree
- [ ] Enable HTTPS (required for production)
- [ ] Test with small production payment ($1 or less)
- [ ] Monitor logs and webhook delivery
- [ ] Enable payment notifications/emails

---

## NEXT IMMEDIATE ACTIONS

1. **Right Now:** Register with Cashfree (5 minutes)
2. **In 1 Hour:** Get sandbox credentials
3. **In 5 Minutes:** Update .env with credentials
4. **In 3 Minutes:** Configure webhook
5. **In 5 Minutes:** Test payment flow

**Total time to production: ~20 minutes**

---

## SUPPORT RESOURCES

- **Cashfree Dashboard:** https://dashboard.cashfree.com
- **Cashfree Docs:** https://docs.cashfree.com
- **Cashfree Support:** https://support.cashfree.com
- **Backend Documentation:** See other PAYMENT_*.md files in this directory

---

## SUMMARY

✅ Backend: FULLY IMPLEMENTED & RUNNING
⏳ Your Action: ADD CASHFREE CREDENTIALS
✅ Result: FULL PAYMENT PROCESSING

Everything is ready. Just need your Cashfree credentials!
