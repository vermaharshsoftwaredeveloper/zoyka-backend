import prisma from './src/config/prisma.js';

async function main() {
  // Get user
  const user = await prisma.user.findUnique({
    where: { email: 'bpmnayak143@gmail.com' }
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  // Get product
  const product = await prisma.product.findFirst({
    where: { isActive: true }
  });
  
  if (!product) {
    console.log('No products found');
    return;
  }
  
  // Get or create address
  let address = await prisma.address.findFirst({
    where: { userId: user.id }
  });
  
  if (!address) {
    address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: user.name,
        phoneNumber: '9999999999',
        line1: 'Test Line 1',
        district: 'Test District',
        state: 'Test State',
        pincode: '500001',
        type: 'HOME'
      }
    });
    console.log('✅ Address created');
  }
  
  // Create delivered order
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      productId: product.id,
      addressId: address.id,
      quantity: 1,
      unitPrice: product.sellingPrice,
      totalAmount: product.sellingPrice,
      paymentStatus: 'PAID',
      status: 'DELIVERED'
    }
  });
  
  console.log('\n🎉 SUCCESS! Test data created:');
  console.log('Product ID:', product.id);
  console.log('Product:', product.title);
  console.log('Order ID:', order.id);
  console.log('\n📝 Test the review API with:');
  console.log(`POST http://localhost:3001/api/products/${product.id}/reviews`);
  console.log('\nPayload:');
  console.log(JSON.stringify({
    rating: 5,
    comment: "Thanks for the best product",
    wouldRecommend: true,
    images: []
  }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
