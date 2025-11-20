import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMissingStangle() {
  console.log('🥖 Adding missing Štangle products...');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found.');
  }

  // ŠTANGLE products that should exist
  const stangleItems = [
    {
      name: 'Pizza Štangle',
      description: 'Chrumkavé pizza tyčinky s bylinkami a olivovým olejom',
      priceCents: 349,
      image: null,
      category: 'STANGLE',
    },
    {
      name: 'Pizza Štangle bezlepkové',
      description: 'Bezlepkové chrumkavé pizza tyčinky s bylinkami',
      priceCents: 549,
      image: null,
      category: 'STANGLE',
    },
  ];

  for (const item of stangleItems) {
    // Check if item already exists
    const existing = await prisma.product.findFirst({
      where: {
        tenantId: pornopizza.id,
        name: item.name,
        category: 'STANGLE',
      },
    });
    
    if (existing) {
      // Update existing item to ensure it's active
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          ...item,
          isActive: true,
        },
      });
      console.log(`✏️  Updated: ${item.name}`);
    } else {
      // Create new item
      await prisma.product.create({
        data: {
          ...item,
          tenantId: pornopizza.id,
          isActive: true,
        },
      });
      console.log(`✅ Created: ${item.name}`);
    }
  }

  // Show final STANGLE products
  const allStangle = await prisma.product.findMany({
    where: {
      tenantId: pornopizza.id,
      category: 'STANGLE',
      isActive: true,
    },
    select: {
      name: true,
    },
  });

  console.log(`\n📋 STANGLE products in database:`);
  allStangle.forEach(p => console.log(`   - ${p.name}`));
  console.log(`\n🎉 Done! Total STANGLE products: ${allStangle.length}`);
}

addMissingStangle()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });








