import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupProducts() {
  console.log('🧹 Cleaning up products according to requirements...');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found.');
  }

  // 1. DRINKS - Deactivate all except these 9
  const allowedDrinks = [
    'Bonaqua Nesýtená 1,5l',
    'Bonaqua Sýtená 1,5l',
    'Kofola 2l',
    'Pepsi 1l',
    'Pepsi Zero 1l',
    'Sprite 1l',
    'Fanta 1l',
    'Coca Cola 1l',
    'Cola Zero 1l',
  ];

  const deactivatedDrinks = await prisma.product.updateMany({
    where: {
      tenantId: pornopizza.id,
      category: 'DRINKS',
      name: {
        notIn: allowedDrinks,
      },
    },
    data: {
      isActive: false,
    },
  });
  console.log(`✅ Deactivated ${deactivatedDrinks.count} extra DRINKS products`);

  // Ensure allowed drinks are active
  for (const drinkName of allowedDrinks) {
    const existing = await prisma.product.findFirst({
      where: {
        tenantId: pornopizza.id,
        name: drinkName,
        category: 'DRINKS',
      },
    });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }
  }
  console.log(`✅ Ensured ${allowedDrinks.length} DRINKS are active`);

  // 2. DESSERTS - Deactivate all except Tiramisu
  const deactivatedDesserts = await prisma.product.updateMany({
    where: {
      tenantId: pornopizza.id,
      category: 'DESSERTS',
      name: {
        not: 'Tiramisu',
      },
    },
    data: {
      isActive: false,
    },
  });
  console.log(`✅ Deactivated ${deactivatedDesserts.count} extra DESSERTS products`);

  // Ensure Tiramisu is active
  const tiramisu = await prisma.product.findFirst({
    where: {
      tenantId: pornopizza.id,
      name: 'Tiramisu',
      category: 'DESSERTS',
    },
  });
  if (tiramisu) {
    await prisma.product.update({
      where: { id: tiramisu.id },
      data: { isActive: true },
    });
    console.log(`✅ Ensured Tiramisu is active`);
  }

  // 3. SIDES - DELETE ALL (check for orders first)
  const sidesProducts = await prisma.product.findMany({
    where: {
      tenantId: pornopizza.id,
      category: 'SIDES',
    },
    include: {
      orderItems: true,
    },
  });

  if (sidesProducts.length > 0) {
    // Check if any have order items
    const productsWithOrders = sidesProducts.filter(p => p.orderItems.length > 0);
    
    if (productsWithOrders.length > 0) {
      console.log(`⚠️  Found ${productsWithOrders.length} SIDES products with existing orders.`);
      console.log(`   These products will be deactivated instead of deleted to preserve order history.`);
      
      // Deactivate products with orders
      for (const product of productsWithOrders) {
        await prisma.product.update({
          where: { id: product.id },
          data: { isActive: false },
        });
      }
    }

    // Delete products without orders
    const productsWithoutOrders = sidesProducts.filter(p => p.orderItems.length === 0);
    if (productsWithoutOrders.length > 0) {
      const productIds = productsWithoutOrders.map(p => p.id);
      const deleted = await prisma.product.deleteMany({
        where: {
          id: { in: productIds },
        },
      });
      console.log(`✅ Deleted ${deleted.count} SIDES products (no orders)`);
    }

    if (productsWithOrders.length > 0) {
      console.log(`✅ Deactivated ${productsWithOrders.length} SIDES products (have orders)`);
    }
  } else {
    console.log(`✅ No SIDES products found to delete`);
  }

  // Summary
  console.log('\n📊 Final Summary:');
  const summary = await prisma.product.groupBy({
    by: ['category'],
    where: {
      tenantId: pornopizza.id,
      isActive: true,
    },
    _count: {
      id: true,
    },
  });

  for (const group of summary) {
    console.log(`   ${group.category}: ${group._count.id} products`);
  }

  console.log('\n🎉 Cleanup complete!');
}

cleanupProducts()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });








