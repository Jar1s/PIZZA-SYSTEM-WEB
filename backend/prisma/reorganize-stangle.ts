import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reorganizeStangle() {
  console.log('🥖 Reorganizing Štangle items...');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found.');
  }

  // Find all Štangle items currently in PIZZA category
  const stanglePizzas = await prisma.product.findMany({
    where: {
      tenantId: pornopizza.id,
      name: {
        contains: 'Štangle',
      },
    },
  });

  console.log(`Found ${stanglePizzas.length} Štangle items to move:`);
  stanglePizzas.forEach(p => console.log(`  - ${p.name} (current category: ${p.category})`));

  // Move them to STANGLE category
  for (const pizza of stanglePizzas) {
    await prisma.product.update({
      where: { id: pizza.id },
      data: { 
        category: 'STANGLE',
        isActive: true,
      },
    });
    console.log(`  ✅ Moved: ${pizza.name} → STANGLE category`);
  }

  // Also check for Korpus/Posúch items
  const korpusItems = await prisma.product.findMany({
    where: {
      tenantId: pornopizza.id,
      OR: [
        { name: { contains: 'Korpus' } },
        { name: { contains: 'Posúch' } },
      ],
    },
  });

  console.log(`\nFound ${korpusItems.length} Korpus/Posúch items:`);
  for (const item of korpusItems) {
    if (item.category !== 'STANGLE') {
      await prisma.product.update({
        where: { id: item.id },
        data: { 
          category: 'STANGLE',
          isActive: true,
        },
      });
      console.log(`  ✅ Moved: ${item.name} → STANGLE category`);
    } else {
      console.log(`  ✓ Already in STANGLE: ${item.name}`);
    }
  }

  // Count final STANGLE items
  const finalStangle = await prisma.product.findMany({
    where: {
      tenantId: pornopizza.id,
      category: 'STANGLE',
      isActive: true,
    },
  });

  console.log(`\n🎉 Reorganization complete!`);
  console.log(`🥖 Total items in STANGLE category: ${finalStangle.length}`);
  console.log('\nItems:');
  finalStangle.forEach(item => console.log(`  - ${item.name} (€${(item.priceCents / 100).toFixed(2)})`));
}

reorganizeStangle()
  .catch((e) => {
    console.error('❌ Reorganization failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

