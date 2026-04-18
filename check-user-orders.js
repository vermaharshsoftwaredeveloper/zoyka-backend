import prisma from './src/config/prisma.js';

const checkUserOrders = async () => {
  try {
    // Get a sample user from the database
    const user = await prisma.user.findFirst({
      where: { role: 'USER' },
      select: { id: true, email: true, name: true }
    });
    
    if (!user) {
      console.log('No users found');
      await prisma.$disconnect();
      return;
    }
    
    console.log('\n=== USER INFO ===');
    console.log('User:', user.name, `(${user.email})`);
    console.log('User ID:', user.id);
    
    // Get orders for this user
    const orders = await prisma.order.findMany({
      where: { 
        userId: user.id,
        status: 'DELIVERED' // Only delivered orders can be reviewed
      },
      select: {
        id: true,
        productId: true,
        status: true,
        product: {
          select: {
            id: true,
            title: true,
          }
        }
      },
      take: 10
    });
    
    console.log('\n=== DELIVERED ORDERS (Can be reviewed) ===');
    if (orders.length === 0) {
      console.log('❌ No delivered orders found for this user');
      
      // Show all products the user can potentially review
      const allOrders = await prisma.order.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          productId: true,
          status: true,
          product: {
            select: {
              id: true,
              title: true,
            }
          }
        },
        take: 10
      });
      
      if (allOrders.length > 0) {
        console.log('\nAll orders (any status):');
        allOrders.forEach(order => {
          console.log(`   Product ID: ${order.productId}`);
          console.log(`   Title: ${order.product.title}`);
          console.log(`   Status: ${order.status}`);
          console.log('   ---');
        });
      }
    } else {
      orders.forEach(order => {
        console.log(`✅ Product ID: ${order.productId}`);
        console.log(`   Title: ${order.product.title}`);
        console.log(`   Order ID: ${order.id}`);
        console.log('   ---');
      });
    }
    
    // Also show some active products
    console.log('\n=== SAMPLE ACTIVE PRODUCTS ===');
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
      },
      take: 5
    });
    
    products.forEach(p => {
      console.log(`   ${p.id} - ${p.title}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
};

checkUserOrders();
