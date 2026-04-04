import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDesserts() {
  console.log('🍰 Cleaning up desserts - keeping only Tiramisu...');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found.');
  }

  // Find all desserts
  const allDesserts = await prisma.product.findMany({
    where: {
      tenantId: pornopizza.id,
      category: 'DESSERTS',
    },
  });

  console.log(`Found ${allDesserts.length} dessert(s) in database:`);
  allDesserts.forEach(d => console.log(`  - ${d.name}`));

  // Deactivate all desserts except Tiramisu
  const dessertsToDeactivate = allDesserts.filter(d => d.name !== 'Tiramisu');
  
  if (dessertsToDeactivate.length > 0) {
    console.log(`\nDeactivating ${dessertsToDeactivate.length} dessert(s)...`);
    for (const dessert of dessertsToDeactivate) {
      await prisma.product.update({
        where: { id: dessert.id },
        data: { isActive: false },
      });
      console.log(`  ❌ Deactivated: ${dessert.name}`);
    }
  }

  // Make sure Tiramisu exists and is active
  const tiramisu = allDesserts.find(d => d.name === 'Tiramisu');
  
  if (!tiramisu) {
    // Create Tiramisu if it doesn't exist
    await prisma.product.create({
      data: {
        name: 'Tiramisu',
        description: 'Classic Italian dessert with layers of coffee-soaked ladyfingers, mascarpone cream, and cocoa powder',
        priceCents: 490,
        image: null,
        category: 'DESSERTS',
        tenantId: pornopizza.id,
        isActive: true,
      },
    });
    console.log('\n✅ Created: Tiramisu');
  } else if (!tiramisu.isActive) {
    // Activate Tiramisu if it's deactivated
    await prisma.product.update({
      where: { id: tiramisu.id },
      data: { isActive: true },
    });
    console.log('\n✅ Activated: Tiramisu');
  } else {
    console.log('\n✅ Tiramisu is already active');
  }

  console.log('\n🎉 Cleanup complete! Only Tiramisu is now active in desserts.');
}

cleanupDesserts()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

