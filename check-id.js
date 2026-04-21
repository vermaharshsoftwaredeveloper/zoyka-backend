import prisma from './src/config/prisma.js';

async function checkId() {
  const id = '31821955-676d-4a13-be01-528253564a26';
  
  console.log('\n🔍 Checking ID:', id);
  console.log('='.repeat(60));
  
  // Check if it's a product
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, title: true }
  });
  
  if (product) {
    console.log('✅ PRODUCT FOUND:');
    console.log('   ID:', product.id);
    console.log('   Title:', product.title);
  } else {
    console.log('❌ Not a Product ID');
  }
  
  // Check if it's an order
  const order = await prisma.order.findUnique({
    where: { id },
    select: { 
      id: true, 
      productId: true,
      status: true,
      product: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });
  
  if (order) {
    console.log('\n✅ ORDER FOUND:');
    console.log('   Order ID:', order.id);
    console.log('   Status:', order.status);
    console.log('   Product ID:', order.productId);
    console.log('   Product Title:', order.product.title);
    console.log('\n📝 CORRECT Review API URL:');
    console.log(`   POST http://localhost:3001/api/products/${order.productId}/reviews`);
  } else {
    console.log('\n❌ Not an Order ID');
  }
  
  // If neither, show user's orders
  if (!product && !order) {
    console.log('\n📋 Recent Orders for user:');
    const user = await prisma.user.findFirst({
      where: { email: 'bpmnayak143@gmail.com' }
    });
    
    if (user) {
      const orders = await prisma.order.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          productId: true,
          status: true,
          product: {
            select: {
              id: true,
              title: true
            }
          }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      
      orders.forEach(o => {
        console.log(`\n   Order ID: ${o.id}`);
        console.log(`   Product ID: ${o.productId}`);
        console.log(`   Product: ${o.product.title}`);
        console.log(`   Status: ${o.status}`);
        if (o.status === 'DELIVERED') {
          console.log(`   ✅ Can review: POST /api/products/${o.productId}/reviews`);
        }
      });
    }
  }
  
  await prisma.$disconnect();
}

checkId().catch(console.error);
