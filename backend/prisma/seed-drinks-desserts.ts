import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDrinksAndDesserts() {
  console.log('🥤🍰 Adding drinks and desserts to PornoPizza menu...');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found. Run main seed first.');
  }

  // DESSERTS - Just Tiramisu
  const desserts = [
    {
      name: 'Tiramisu',
      description: 'Classic Italian dessert with layers of coffee-soaked ladyfingers, mascarpone cream, and cocoa powder',
      priceCents: 490,
      image: null, // No image for now
      category: 'DESSERTS',
    },
  ];

  // DRINKS - Popular options
  const drinks = [
    {
      name: 'Coca-Cola 0.33L',
      description: 'Classic Coca-Cola in a can',
      priceCents: 250,
      image: null,
      category: 'DRINKS',
    },
    {
      name: 'Coca-Cola 0.5L',
      description: 'Classic Coca-Cola in a bottle',
      priceCents: 350,
      image: null,
      category: 'DRINKS',
    },
    {
      name: 'Coca-Cola Zero 0.33L',
      description: 'Zero sugar Coca-Cola in a can',
      priceCents: 250,
      image: null,
      category: 'DRINKS',
    },
    {
      name: 'Fanta Orange 0.33L',
      description: 'Refreshing orange soda in a can',
      priceCents: 250,
      image: null,
      category: 'DRINKS',
    },
    {
      name: 'Sprite 0.33L',
      description: 'Lemon-lime refreshment in a can',
      priceCents: 250,
      image: null,
      category: 'DRINKS',
    },
    {
      name: 'Water 0.5L',
      description: 'Still mineral water',
      priceCents: 200,
      image: null,
      category: 'DRINKS',
    },
    {
      name: 'Sparkling Water 0.5L',
      description: 'Sparkling mineral water',
      priceCents: 200,
      image: null,
      category: 'DRINKS',
    },
    {
      name: 'Ice Tea Peach 0.33L',
      description: 'Refreshing peach ice tea',
      priceCents: 250,
      image: null,
      category: 'DRINKS',
    },
    {
      name: 'Ice Tea Lemon 0.33L',
      description: 'Refreshing lemon ice tea',
      priceCents: 250,
      image: null,
      category: 'DRINKS',
    },
    {
      name: 'Orange Juice 0.25L',
      description: '100% orange juice',
      priceCents: 300,
      image: null,
      category: 'DRINKS',
    },
  ];

  const allItems = [...desserts, ...drinks];
  
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
  console.log(`🍰 Desserts: ${desserts.length}`);
  console.log(`🥤 Drinks: ${drinks.length}`);
}

seedDrinksAndDesserts()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

