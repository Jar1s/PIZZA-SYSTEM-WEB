import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupStangle() {
  console.log('🥖 Cleaning up and updating Štangle items...');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found.');
  }

  // 1. DELETE: Štangle Classic, Special, Deluxe
  const itemsToDelete = ['Štangle Classic', 'Štangle Special', 'Štangle Deluxe'];
  
  console.log('\n❌ DELETING items:');
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

  // 2. UPDATE: Add images to remaining stangle items
  console.log('\n✅ UPDATING with images:');
  
  // Pizza Štangle - regular breadstick
  const pizzaStangle = await prisma.product.findFirst({
    where: {
      tenantId: pornopizza.id,
      name: 'Pizza Štangle',
    },
  });
  
  if (pizzaStangle) {
    await prisma.product.update({
      where: { id: pizzaStangle.id },
      data: { image: '/images/stangle/stangle-regular.jpg' },
    });
    console.log(`  ✅ Updated: Pizza Štangle → added image`);
  }
  
  // Pizza Štangle bezlepkové - gluten-free
  const pizzaStangleBezlepkove = await prisma.product.findFirst({
    where: {
      tenantId: pornopizza.id,
      name: 'Pizza Štangle bezlepkové',
    },
  });
  
  if (pizzaStangleBezlepkove) {
    await prisma.product.update({
      where: { id: pizzaStangleBezlepkove.id },
      data: { image: '/images/stangle/stangle-gluten-free.jpg' },
    });
    console.log(`  ✅ Updated: Pizza Štangle bezlepkové → added image`);
  }
  
  // Pizza Posúch / Korpus - regular
  const pizzaPosuch = await prisma.product.findFirst({
    where: {
      tenantId: pornopizza.id,
      name: 'Pizza Posúch / Korpus',
    },
  });
  
  if (pizzaPosuch) {
    await prisma.product.update({
      where: { id: pizzaPosuch.id },
      data: { image: '/images/stangle/stangle-regular.jpg' },
    });
    console.log(`  ✅ Updated: Pizza Posúch / Korpus → added image`);
  }
  
  // Pizza Posúch bezlepkový - gluten-free
  const pizzaPosuchBezlepkovy = await prisma.product.findFirst({
    where: {
      tenantId: pornopizza.id,
      name: 'Pizza Posúch bezlepkový',
    },
  });
  
  if (pizzaPosuchBezlepkovy) {
    await prisma.product.update({
      where: { id: pizzaPosuchBezlepkovy.id },
      data: { image: '/images/stangle/stangle-gluten-free.jpg' },
    });
    console.log(`  ✅ Updated: Pizza Posúch bezlepkový → added image`);
  }

  // Also check if Korpus pizza image needs updating
  const korpus = await prisma.product.findFirst({
    where: {
      tenantId: pornopizza.id,
      name: 'Korpus',
    },
  });
  
  if (korpus) {
    await prisma.product.update({
      where: { id: korpus.id },
      data: { image: '/images/pizzas/classic/korpus.jpg' },
    });
    console.log(`  ✅ Updated: Korpus → added image from pizzas`);
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
  console.log(`🥖 Total active STANGLE items: ${finalStangle.length}`);
  console.log('\n📋 Final STANGLE menu:');
  finalStangle.forEach(item => {
    const hasImage = item.image ? '🖼️' : '⬜';
    console.log(`  ${hasImage} ${item.name} - €${(item.priceCents / 100).toFixed(2)}`);
  });
}

cleanupStangle()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

