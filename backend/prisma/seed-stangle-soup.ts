import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedStangleAndSoup() {
  console.log('🥖🍲 Adding Štangle and Soup to PornoPizza menu...');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found. Run main seed first.');
  }

  // ŠTANGLE (Breadsticks) - Special category
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
    {
      name: 'Pizza Posúch / Korpus',
      description: 'Tradičný posúch s cesnakom a bylinkami',
      priceCents: 349,
      image: null,
      category: 'STANGLE',
    },
    {
      name: 'Pizza Posúch bezlepkový',
      description: 'Bezlepkový posúch s cesnakom a bylinkami',
      priceCents: 549,
      image: null,
      category: 'STANGLE',
    },
  ];

  // POLIEVKY (Soups)
  const soupItems = [
    {
      name: 'Paradajková polievka',
      description: 'Krémová paradajková polievka s čerstvou bazalkou a parmezánom',
      priceCents: 449,
      image: null,
      category: 'SOUPS',
    },
  ];

  const allItems = [...stangleItems, ...soupItems];
  
  for (const item of allItems) {
    // Check if item already exists
    const existing = await prisma.product.findFirst({
      where: {
        tenantId: pornopizza.id,
        name: item.name,
      },
    });
    
    if (existing) {
      // Update existing item
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

  console.log(`\n🎉 Successfully added ${allItems.length} items to PornoPizza!`);
  console.log(`🥖 Štangle/Posúch: ${stangleItems.length}`);
  console.log(`🍲 Polievky: ${soupItems.length}`);
}

seedStangleAndSoup()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

