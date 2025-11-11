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

  // DRINKS - Only products from images
  const drinks = [
    {
      name: 'Bonaqua Nesýtená 1,5l',
      description: 'Still mineral water',
      priceCents: 214,
      image: null,
      category: 'DRINKS',
    },
    {
      name: 'Bonaqua Sýtená 1,5l',
      description: 'Sparkling mineral water',
      priceCents: 214,
      image: null,
      category: 'DRINKS',
    },
    {
      name: 'Kofola 2l',
      description: 'Classic Kofola',
      priceCents: 315,
      image: null,
      category: 'DRINKS',
    },
    {
      name: 'Pepsi 1l',
      description: 'Classic Pepsi',
      priceCents: 265,
      image: null,
      category: 'DRINKS',
    },
    {
      name: 'Pepsi Zero 1l',
      description: 'Zero sugar Pepsi',
      priceCents: 265,
      image: null,
      category: 'DRINKS',
    },
    {
      name: 'Sprite 1l',
      description: 'Lemon-lime Sprite',
      priceCents: 265,
      image: null,
      category: 'DRINKS',
    },
    {
      name: 'Fanta 1l',
      description: 'Orange Fanta',
      priceCents: 265,
      image: null,
      category: 'DRINKS',
    },
    {
      name: 'Coca Cola 1l',
      description: 'Classic Coca-Cola',
      priceCents: 265,
      image: null,
      category: 'DRINKS',
    },
    {
      name: 'Cola Zero 1l',
      description: 'Zero sugar Coca-Cola',
      priceCents: 265,
      image: null,
      category: 'DRINKS',
    },
  ];

  const allItems = [...desserts, ...drinks];
  
  // First, deactivate all existing DRINKS products that are not in our list
  const drinkNames = drinks.map(d => d.name);
  await prisma.product.updateMany({
    where: {
      tenantId: pornopizza.id,
      category: 'DRINKS',
      name: {
        notIn: drinkNames,
      },
    },
    data: {
      isActive: false,
    },
  });
  console.log('📝 Deactivated other DRINKS products');
  
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

