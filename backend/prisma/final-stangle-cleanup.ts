import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalStangleCleanup() {
  console.log('🥖 Final Štangle cleanup...');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found.');
  }

  // 1. DELETE items we don't want
  const itemsToDelete = [
    'Pizza Štangle',
    'Pizza Štangle bezlepkové',
    'Korpus',
  ];
  
  console.log('\n❌ DELETING:');
  for (const name of itemsToDelete) {
    const items = await prisma.product.findMany({
      where: {
        tenantId: pornopizza.id,
        name: name,
      },
    });
    
    for (const item of items) {
      await prisma.product.delete({
        where: { id: item.id },
      });
      console.log(`  ❌ Deleted: ${item.name}`);
    }
  }

  // 2. UPDATE the two Posúch items with korpus image
  console.log('\n✅ UPDATING:');
  
  // Pizza Posúch / Korpus - regular
  const posuch = await prisma.product.findFirst({
    where: {
      tenantId: pornopizza.id,
      name: 'Pizza Posúch / Korpus',
    },
  });
  
  if (posuch) {
    await prisma.product.update({
      where: { id: posuch.id },
      data: { 
        name: 'Pizza Posúch',
        image: '/images/pizzas/classic/korpus.jpg',
        description: 'Tradičný posúch s cesnakom a bylinkami',
      },
    });
    console.log(`  ✅ Updated: Pizza Posúch → added korpus image`);
  }
  
  // Pizza Posúch bezlepkový
  const posuchBezlepkovy = await prisma.product.findFirst({
    where: {
      tenantId: pornopizza.id,
      name: 'Pizza Posúch bezlepkový',
    },
  });
  
  if (posuchBezlepkovy) {
    await prisma.product.update({
      where: { id: posuchBezlepkovy.id },
      data: { 
        image: '/images/pizzas/classic/korpus.jpg',
        description: 'Bezlepkový posúch s cesnakom a bylinkami',
      },
    });
    console.log(`  ✅ Updated: Pizza Posúch bezlepkový → added korpus image`);
  }

  // 3. COUNT final results
  const finalStangle = await prisma.product.findMany({
    where: {
      tenantId: pornopizza.id,
      category: 'STANGLE',
      isActive: true,
    },
  });

  console.log(`\n🎉 Cleanup complete!`);
  console.log(`🥖 Total STANGLE items: ${finalStangle.length}`);
  console.log('\n📋 Final STANGLE menu:');
  finalStangle.forEach(item => {
    console.log(`  ✅ ${item.name} - €${(item.priceCents / 100).toFixed(2)}`);
    console.log(`     Image: ${item.image}`);
    console.log(`     Description: ${item.description}`);
  });
}

finalStangleCleanup()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

