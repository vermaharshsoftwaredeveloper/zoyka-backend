# Quick Reference: Payment Gateway Troubleshooting

## 🚀 Quick Start

**Test the payment flow:**
```bash
# Terminal 1: Backend
cd zoyka-backend && pnpm run dev

# Terminal 2: Frontend  
cd zoyka-frontend/zoyka-frontend && npm run dev

# Open http://localhost:5173
# Add to cart → Checkout → Select UPI → Order Now → Should redirect to Cashfree
```

---

## ✅ Expected Behavior

### When You Click "Order Now" with UPI Selected:
```
✅ No error about missing headers
✅ Backend processes order creation
✅ Cashfree API receives request with x-api-version header
✅ Response includes payment_link
✅ Frontend redirects to Cashfree payment page
✅ You see Cashfree's payment interface (not your custom form)
```

---

## ❌ Common Issues & Fixes

### Issue 1: "version is missing in header"
**Status:** ✅ FIXED  
**What to do:** Make sure you're using the latest backend code with the header fix

### Issue 2: Blank page after clicking "Order Now"
**Causes:** 
- Payment processing
- Network issue
**Fix:** Wait 2-3 seconds, check browser console for errors

### Issue 3: "Cashfree credentials not configured"
**Fix:** Check .env file has CASHFREE_APP_ID and CASHFREE_SECRET_KEY
```bash
# Verify in .env
grep CASHFREE .env
```

### Issue 4: "Invalid credentials"
**Fix:** Credentials in .env must match Cashfree sandbox credentials
- Get from: https://sandbox.cashfree.com/dashboard
- Update both .env and restart backend

### Issue 5: Redirect not happening
**Fix:** 
1. Check browser console for errors
2. Verify paymentUrl is in response: `console.log(checkoutResult?.paymentUrl)`
3. Check network tab to see actual request/response

---

## 🔍 Debugging Checklist

### Backend Logs
```bash
# Should see:
✓ Order created successfully
✓ Payment session ID: ...
✓ Cashfree API called
✓ Payment link: https://sandbox.cashfree.com/pay/...
```

### Browser Console
```javascript
// Check in DevTools Console (F12):
checkoutResult.paymentUrl  // Should have Cashfree URL

// Before redirect
window.location.href = "https://sandbox.cashfree.com/pay/..."
```

### Database
```sql
-- Check PaymentSession table
SELECT id, status, amount, paymentMethod FROM PaymentSession 
WHERE status = 'PENDING' LIMIT 1;

-- Should show: PENDING, amount, UPI
```

---

## 📋 Payment Methods Supported

| Method | Test With | Status |
|--------|-----------|--------|
| UPI | Google Pay, PhonePe | ✅ Fixed |
| Card | 4111111111111111 | ✅ Ready |
| COD | Select & Order | ✅ Direct order |
| Net Banking | Your bank | ✅ Via Cashfree |

---

## 🎯 What Changed

**Files Modified:**
1. `src/modules/payment/cashfree.js` - Added header
2. `src/modules/order/order.service.js` - Added header  
3. `src/features/cart/ProductCheckout.jsx` - UI improved

**Header Added:**
```javascript
"x-api-version": "2023-08-01"
```

---

## ⚡ Quick Commands

```bash
# Verify fix applied
grep -r "x-api-version" zoyka-backend/src/

# Check if backend is running
curl -X GET http://localhost:3001/api/health

# Test payment endpoint structure
curl -X POST http://localhost:3001/api/orders/checkout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"addressId":"...", "paymentMethod":"upi"}'
```

---

## 🆘 If Still Not Working

### Step 1: Restart Backend
```bash
# Kill existing process
lsof -ti:3001 | xargs kill -9  # Linux/Mac
netstat -ano | findstr :3001   # Windows

# Restart
cd zoyka-backend && pnpm run dev
```

### Step 2: Clear Environment
```bash
# Verify env loaded correctly
node -e "console.log(process.env.CASHFREE_APP_ID)"
```

### Step 3: Check Cashfree Status
- Visit https://sandbox.cashfree.com/dashboard
- Verify API keys are active
- Check if sandbox environment is enabled

### Step 4: Review Logs
```bash
# Backend logs for errors
# Check terminal where pnpm run dev is running
# Look for "Cashfree API Error" messages
```

---

## 📞 Support Resources

- **Cashfree Docs:** https://docs.cashfree.com
- **Payment Flow:** See CASHFREE_PAYMENT_FLOW.md
- **API Version:** 2023-08-01 (current)
- **Environment:** Sandbox for testing

---

## 🎓 Learning Path

1. **Understand Flow:** Read CASHFREE_PAYMENT_FLOW.md
2. **Verify Headers:** Run `node verify-cashfree-headers.js`
3. **Test Checkout:** Follow Quick Start above
4. **Check Logs:** Monitor backend logs during checkout
5. **Verify Payment:** Check Cashfree dashboard for order
6. **Confirm Status:** Check PaymentSession table in database

---

**Need more help?**  
Check PAYMENT_FIX_SUMMARY.md for detailed information
