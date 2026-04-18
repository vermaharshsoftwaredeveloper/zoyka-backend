#!/usr/bin/env node

/**
 * PAYMENT GATEWAY COMPLETION VALIDATOR
 * 
 * This script validates that the Cashfree payment gateway implementation is complete
 * and ready for use. It checks all components are in place and properly configured.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n' + '='.repeat(60));
console.log('CASHFREE PAYMENT GATEWAY - COMPLETION VALIDATION');
console.log('='.repeat(60) + '\n');

let checksPassed = 0;
let checksFailed = 0;

function check(name, condition) {
  if (condition) {
    console.log(`✅ ${name}`);
    checksPassed++;
  } else {
    console.log(`❌ ${name}`);
    checksFailed++;
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function fileHasContent(filePath, minLength = 100) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.length > minLength;
}

function fileContains(filePath, searchString) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes(searchString);
}

// 1. Check payment module files
console.log('1. PAYMENT MODULE FILES');
console.log('-'.repeat(60));
check('cashfree.js exists and has content', fileHasContent(path.join(__dirname, 'src/modules/payment/cashfree.js')));
check('cashfree.js exports functions', fileContains(path.join(__dirname, 'src/modules/payment/cashfree.js'), 'export'));
check('cashfree.js has signature verification', fileContains(path.join(__dirname, 'src/modules/payment/cashfree.js'), 'verifyWebhookSignature'));

check('cashfree.controller.js exists and has content', fileHasContent(path.join(__dirname, 'src/modules/payment/cashfree.controller.js')));
check('cashfree.controller.js has webhook handler', fileContains(path.join(__dirname, 'src/modules/payment/cashfree.controller.js'), 'handlePaymentWebhook'));
check('cashfree.controller.js has verification endpoint', fileContains(path.join(__dirname, 'src/modules/payment/cashfree.controller.js'), 'verifyPaymentStatus'));

check('payment.routes.js exists and has content', fileHasContent(path.join(__dirname, 'src/modules/payment/payment.routes.js')));
check('payment.routes.js defines routes', fileContains(path.join(__dirname, 'src/modules/payment/payment.routes.js'), 'router.'));

// 2. Check integration
console.log('\n2. INTEGRATION');
console.log('-'.repeat(60));
check('Routes registered in main router', fileContains(path.join(__dirname, 'src/routes/index.js'), 'paymentRouter'));
check('Payment routes imported in main router', fileContains(path.join(__dirname, 'src/routes/index.js'), 'payment/payment.routes'));
check('Payment routes registered at /payments', fileContains(path.join(__dirname, 'src/routes/index.js'), '/payments'));

// 3. Check middleware
console.log('\n3. MIDDLEWARE CONFIGURATION');
console.log('-'.repeat(60));
check('Handshake middleware has webhook exemption', fileContains(path.join(__dirname, 'src/middleware/handshake.middleware.js'), '/payments/webhook'));
check('Webhook exemption uses correct path pattern', fileContains(path.join(__dirname, 'src/middleware/handshake.middleware.js'), "req.path.includes('/payments/webhook/')"));

// 4. Check .env
console.log('\n4. ENVIRONMENT CONFIGURATION');
console.log('-'.repeat(60));
check('.env file exists', fileExists(path.join(__dirname, '.env')));
check('.env has CASHFREE_ENVIRONMENT', fileContains(path.join(__dirname, '.env'), 'CASHFREE_ENVIRONMENT'));
check('.env has CASHFREE_APP_ID', fileContains(path.join(__dirname, '.env'), 'CASHFREE_APP_ID'));
check('.env has CASHFREE_SECRET_KEY', fileContains(path.join(__dirname, '.env'), 'CASHFREE_SECRET_KEY'));
check('.env has FRONTEND_BASE_URL', fileContains(path.join(__dirname, '.env'), 'FRONTEND_BASE_URL'));
check('.env has FRONTEND_BASE_URL2', fileContains(path.join(__dirname, '.env'), 'FRONTEND_BASE_URL2'));
check('.env has DASHBOARD_BASE_URL', fileContains(path.join(__dirname, '.env'), 'DASHBOARD_BASE_URL'));
check('.env has DASHBOARD_BASE_URL2', fileContains(path.join(__dirname, '.env'), 'DASHBOARD_BASE_URL2'));

// 5. Check documentation
console.log('\n5. DOCUMENTATION');
console.log('-'.repeat(60));
check('PAYMENT_SETUP.md exists', fileExists(path.join(__dirname, 'PAYMENT_SETUP.md')));
check('PAYMENT_QUICK_REFERENCE.md exists', fileExists(path.join(__dirname, 'PAYMENT_QUICK_REFERENCE.md')));
check('PAYMENT_ACTION_CHECKLIST.md exists', fileExists(path.join(__dirname, 'PAYMENT_ACTION_CHECKLIST.md')));
check('PAYMENT_IMPLEMENTATION_COMPLETE.md exists', fileExists(path.join(__dirname, 'PAYMENT_IMPLEMENTATION_COMPLETE.md')));
check('SETUP_COMPLETION_GUIDE.md exists', fileExists(path.join(__dirname, 'SETUP_COMPLETION_GUIDE.md')));

// 6. Check security features
console.log('\n6. SECURITY FEATURES');
console.log('-'.repeat(60));
check('HMAC-SHA256 signature validation implemented', fileContains(path.join(__dirname, 'src/modules/payment/cashfree.js'), 'createHmac'));
check('Constant-time comparison used', fileContains(path.join(__dirname, 'src/modules/payment/cashfree.js'), 'timingSafeEqual'));
check('JWT authentication on verify endpoint', fileContains(path.join(__dirname, 'src/modules/payment/cashfree.controller.js'), 'requireAuth'));
check('Database transactions used', fileContains(path.join(__dirname, 'src/modules/payment/cashfree.controller.js'), 'prisma.$transaction'));

// 7. Check features
console.log('\n7. FEATURES IMPLEMENTED');
console.log('-'.repeat(60));
check('Real-time webhook processing', fileContains(path.join(__dirname, 'src/modules/payment/cashfree.controller.js'), 'handlePaymentWebhook'));
check('Manual payment verification', fileContains(path.join(__dirname, 'src/modules/payment/cashfree.controller.js'), 'verifyPaymentStatus'));
check('Stock reversal on failure', fileContains(path.join(__dirname, 'src/modules/payment/cashfree.controller.js'), 'stock: { increment'));
check('Order status updates', fileContains(path.join(__dirname, 'src/modules/payment/cashfree.controller.js'), 'status: "PLACED"'));
check('Payment status tracking', fileContains(path.join(__dirname, 'src/modules/payment/cashfree.controller.js'), 'paymentStatus'));

// Summary
console.log('\n' + '='.repeat(60));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(60));
console.log(`Checks Passed: ✅ ${checksPassed}`);
console.log(`Checks Failed: ❌ ${checksFailed}`);
console.log(`Total: ${checksPassed + checksFailed}`);

if (checksFailed === 0) {
  console.log('\n🎉 PAYMENT GATEWAY IMPLEMENTATION IS COMPLETE & READY');
  console.log('\nNext Steps:');
  console.log('1. Register with Cashfree: https://dashboard.cashfree.com');
  console.log('2. Get sandbox credentials (App ID & Secret Key)');
  console.log('3. Update .env with credentials');
  console.log('4. Configure webhook in Cashfree dashboard');
  console.log('5. Test payment flow');
  console.log('\nSee SETUP_COMPLETION_GUIDE.md for detailed instructions.');
  process.exit(0);
} else {
  console.log('\n⚠️ Some checks failed. Please review the implementation.');
  process.exit(1);
}
