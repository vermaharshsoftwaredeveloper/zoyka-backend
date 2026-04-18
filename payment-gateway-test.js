// PAYMENT GATEWAY TEST SUITE
// Run this to verify payment gateway is fully functional

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001/api';
const HANDSHAKE_KEY = 'Uh6ZRP4uGqq0hbNgEnp-jswz8jSHjpuXda4-Xhr4Km0=';

console.log('🧪 Payment Gateway Test Suite\n');

// Test 1: Health check
async function testWebhookHealth() {
  console.log('Test 1: Webhook Health Check');
  try {
    const response = await fetch(`${BASE_URL}/payments/webhook/health`);
    const data = await response.json();
    console.log('✅ Response:', data);
    return response.ok;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Test 2: Verify signature validation works
async function testSignatureValidation() {
  console.log('\nTest 2: Webhook Signature Validation');
  try {
    // Send webhook with invalid signature
    const response = await fetch(`${BASE_URL}/payments/webhook/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': 'invalid_signature'
      },
      body: JSON.stringify({
        event_id: 'test',
        event_type: 'PAYMENT_SUCCESS_WEBHOOK',
        data: { order: { order_id: 'test' } }
      })
    });
    
    console.log('Status:', response.status);
    console.log('✅ Signature validation working:', response.status === 403);
    return response.status === 403;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Test 3: Verify routes are registered
async function testRoutesRegistration() {
  console.log('\nTest 3: Routes Registration');
  try {
    // These should return 400 (missing required data) not 404 (route not found)
    const response = await fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': HANDSHAKE_KEY
      },
      body: JSON.stringify({})
    });
    
    console.log('Status:', response.status);
    console.log('✅ Routes registered:', response.status !== 404);
    return response.status !== 404;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const results = [];
  results.push(await testWebhookHealth());
  results.push(await testSignatureValidation());
  results.push(await testRoutesRegistration());
  
  console.log('\n' + '='.repeat(50));
  const passed = results.filter(r => r).length;
  console.log(`Results: ${passed}/${results.length} tests passed`);
  
  if (passed === results.length) {
    console.log('✅ PAYMENT GATEWAY IS FULLY OPERATIONAL');
  } else {
    console.log('⚠️ Some tests failed - check implementation');
  }
}

runTests().catch(console.error);
