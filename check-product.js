import prisma from './src/config/prisma.js';

const checkProduct = async () => {
  try {
    const productId = '31821955-676d-4a13-be01-528253564a26';
    
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        isActive: true,
      }
    });
    
    console.log('\n=== PRODUCT CHECK ===');
    if (product) {
      console.log('✅ Product Found:');
      console.log('   ID:', product.id);
      console.log('   Title:', product.title);
      console.log('   IsActive:', product.isActive);
    } else {
      console.log('❌ Product NOT FOUND');
      
      // Let's try to find any products
      const anyProducts = await prisma.product.findMany({
        take: 5,
        select: { id: true, title: true }
      });
      console.log('\nSample products in database:');
      anyProducts.forEach(p => console.log(`   ${p.id} - ${p.title}`));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
};

checkProduct();
