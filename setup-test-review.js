import prisma from './src/config/prisma.js';

const setupTestReviewData = async () => {
  try {
    // Get the user
    const user = await prisma.user.findFirst({
      where: { email: 'bpmnayak143@gmail.com' },
      select: { id: true, name: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      await prisma.$disconnect();
      return;
    }
    
    // Get an active product
    const product = await prisma.product.findFirst({
      where: { isActive: true },
      select: { id: true, title: true, sellingPrice: true }
    });
    
    if (!product) {
      console.log('❌ No products found');
      await prisma.$disconnect();
      return;
    }
    
    console.log('\n=== SETTING UP TEST DATA ===');
    console.log('User:', user.name);
    console.log('Product:', product.title);
    console.log('Product ID:', product.id);
    
    // Get or create an address for the user
    let address = await prisma.address.findFirst({
      where: { userId: user.id },
      select: { id: true }
    });
    
    if (!address) {
      console.log('Creating test address...');
      address = await prisma.address.create({
        data: {
          userId: user.id,
          fullName: user.name,
          phoneNumber: '9999999999',
          line1: 'Test Address Line 1',
          line2: 'Test Address Line 2',
          district: 'Test District',
          state: 'Test State',
          pincode: '500001',
          isDefault: true,
          type: 'HOME'
        }
      });
    }
    
    // Create a test order with DELIVERED status
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        productId: product.id,
        addressId: address.id,
        quantity: 1,
        unitPrice: product.sellingPrice,
        totalAmount: product.sellingPrice,
        paymentStatus: 'PAID',
        status: 'DELIVERED',
      },
    });
    
    console.log('\n✅ Test Order Created!');
    console.log('Order ID:', order.id);
    console.log('Status:', order.status);
    
    console.log('\n📝 Now you can test the review API with:');
    console.log(`POST http://localhost:3001/api/products/${product.id}/reviews`);
    console.log('\nPayload:');
    console.log(JSON.stringify({
      rating: 5,
      comment: "Thanks for the best product",
      wouldRecommend: true,
      images: []
    }, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
};

setupTestReviewData();
