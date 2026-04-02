import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFullMenu() {
  console.log('🍕 Seeding complete PornoPizza menu...');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found. Run main seed first.');
  }

  // Use upsert to avoid duplicates (will update if exists, create if not)
  // Skip deletion to avoid foreign key constraint issues

  // DRINKS (Nápoje) - 15 items
  const drinks = [
    // Sodas
    {
      name: 'Coca-Cola 0.33L',
      description: 'Classic Coca-Cola',
      priceCents: 250,
      category: 'DRINKS',
      image: '/images/drinks/coca-cola.jpg',
    },
    {
      name: 'Coca-Cola Zero 0.33L',
      description: 'Sugar-free Coca-Cola',
      priceCents: 250,
      category: 'DRINKS',
      image: '/images/drinks/coca-cola-zero.jpg',
    },
    {
      name: 'Fanta 0.33L',
      description: 'Orange Fanta',
      priceCents: 250,
      category: 'DRINKS',
      image: '/images/drinks/fanta.jpg',
    },
    {
      name: 'Sprite 0.33L',
      description: 'Lemon-lime Sprite',
      priceCents: 250,
      category: 'DRINKS',
      image: '/images/drinks/sprite.jpg',
    },
    {
      name: 'Kinley Tonic 0.25L',
      description: 'Tonic water',
      priceCents: 250,
      category: 'DRINKS',
      image: '/images/drinks/kinley.jpg',
    },
    
    // Water
    {
      name: 'Mattoni 0.33L',
      description: 'Still mineral water',
      priceCents: 200,
      category: 'DRINKS',
      image: '/images/drinks/mattoni-still.jpg',
    },
    {
      name: 'Mattoni Perlivá 0.33L',
      description: 'Sparkling mineral water',
      priceCents: 200,
      category: 'DRINKS',
      image: '/images/drinks/mattoni-sparkling.jpg',
    },
    
    // Beer
    {
      name: 'Pilsner Urquell 0.5L',
      description: 'Czech premium lager',
      priceCents: 290,
      category: 'DRINKS',
      image: '/images/drinks/pilsner.jpg',
    },
    {
      name: 'Radegast 0.5L',
      description: 'Czech lager',
      priceCents: 270,
      category: 'DRINKS',
      image: '/images/drinks/radegast.jpg',
    },
    {
      name: 'Heineken 0.33L',
      description: 'International premium lager',
      priceCents: 320,
      category: 'DRINKS',
      image: '/images/drinks/heineken.jpg',
    },
    
    // Wine
    {
      name: 'Veltlínske zelené 0.2L',
      description: 'Slovak white wine',
      priceCents: 390,
      category: 'DRINKS',
      image: '/images/drinks/white-wine.jpg',
    },
    {
      name: 'Frankovka modrá 0.2L',
      description: 'Slovak red wine',
      priceCents: 390,
      category: 'DRINKS',
      image: '/images/drinks/red-wine.jpg',
    },
    
    // Juice
    {
      name: 'Pomarančový džús 0.25L',
      description: 'Fresh orange juice',
      priceCents: 280,
      category: 'DRINKS',
      image: '/images/drinks/orange-juice.jpg',
    },
    {
      name: 'Jablkový džús 0.25L',
      description: 'Apple juice',
      priceCents: 280,
      category: 'DRINKS',
      image: '/images/drinks/apple-juice.jpg',
    },
    {
      name: 'Rajčinový džús 0.25L',
      description: 'Tomato juice',
      priceCents: 280,
      category: 'DRINKS',
      image: '/images/drinks/tomato-juice.jpg',
    },
  ];

  // SIDES (Predjedlá) - 12 items
  const sides = [
    {
      name: 'Cesnaková bageta',
      description: 'Garlic bread with herbs and butter',
      priceCents: 390,
      category: 'SIDES',
      image: '/images/sides/garlic-bread.jpg',
    },
    {
      name: 'Cesnaková bageta so syrom',
      description: 'Garlic bread with melted cheese',
      priceCents: 490,
      category: 'SIDES',
      image: '/images/sides/garlic-bread-cheese.jpg',
    },
    {
      name: 'Chicken Wings 8ks',
      description: 'Crispy chicken wings with BBQ sauce',
      priceCents: 690,
      category: 'SIDES',
      image: '/images/sides/chicken-wings.jpg',
    },
    {
      name: 'Chicken Wings 16ks',
      description: 'Crispy chicken wings with BBQ sauce',
      priceCents: 1290,
      category: 'SIDES',
      image: '/images/sides/chicken-wings-large.jpg',
    },
    {
      name: 'Mozzarella sticks 6ks',
      description: 'Breaded mozzarella with marinara sauce',
      priceCents: 590,
      category: 'SIDES',
      image: '/images/sides/mozzarella-sticks.jpg',
    },
    {
      name: 'Ciabatta so šunkou a syrom',
      description: 'Toasted ciabatta with ham and cheese',
      priceCents: 490,
      category: 'SIDES',
      image: '/images/sides/ciabatta.jpg',
    },
    {
      name: 'Zeleninový šalát',
      description: 'Fresh vegetable salad with dressing',
      priceCents: 490,
      category: 'SIDES',
      image: '/images/sides/vegetable-salad.jpg',
    },
    {
      name: 'Caesar šalát',
      description: 'Classic Caesar salad with chicken and parmesan',
      priceCents: 690,
      category: 'SIDES',
      image: '/images/sides/caesar-salad.jpg',
    },
    {
      name: 'Caprese šalát',
      description: 'Tomato, mozzarella, basil, olive oil',
      priceCents: 590,
      category: 'SIDES',
      image: '/images/sides/caprese-salad.jpg',
    },
    {
      name: 'Frytky',
      description: 'French fries with ketchup',
      priceCents: 350,
      category: 'SIDES',
      image: '/images/sides/french-fries.jpg',
    },
    {
      name: 'Sladké zemiakové frytky',
      description: 'Sweet potato fries',
      priceCents: 450,
      category: 'SIDES',
      image: '/images/sides/sweet-potato-fries.jpg',
    },
    {
      name: 'Olivy s cesnakom',
      description: 'Marinated olives with garlic',
      priceCents: 390,
      category: 'SIDES',
      image: '/images/sides/olives.jpg',
    },
  ];

  // DESSERTS (Dezerty) - 8 items
  const desserts = [
    {
      name: 'Tiramisu',
      description: 'Classic Italian dessert with coffee and mascarpone',
      priceCents: 490,
      category: 'DESSERTS',
      image: '/images/desserts/tiramisu.jpg',
    },
    {
      name: 'Panna Cotta',
      description: 'Italian cream dessert with berry sauce',
      priceCents: 450,
      category: 'DESSERTS',
      image: '/images/desserts/panna-cotta.jpg',
    },
    {
      name: 'Chocolate Lava Cake',
      description: 'Warm chocolate cake with molten center',
      priceCents: 550,
      category: 'DESSERTS',
      image: '/images/desserts/lava-cake.jpg',
    },
    {
      name: 'Cheesecake',
      description: 'New York style cheesecake with strawberries',
      priceCents: 490,
      category: 'DESSERTS',
      image: '/images/desserts/cheesecake.jpg',
    },
    {
      name: 'Zmrzlina vanilková',
      description: 'Vanilla ice cream - 2 scoops',
      priceCents: 350,
      category: 'DESSERTS',
      image: '/images/desserts/vanilla-ice-cream.jpg',
    },
    {
      name: 'Zmrzlina čokoládová',
      description: 'Chocolate ice cream - 2 scoops',
      priceCents: 350,
      category: 'DESSERTS',
      image: '/images/desserts/chocolate-ice-cream.jpg',
    },
    {
      name: 'Zmrzlina jahodová',
      description: 'Strawberry ice cream - 2 scoops',
      priceCents: 350,
      category: 'DESSERTS',
      image: '/images/desserts/strawberry-ice-cream.jpg',
    },
    {
      name: 'Nutella Pizza',
      description: 'Sweet pizza with Nutella and powdered sugar',
      priceCents: 590,
      category: 'DESSERTS',
      image: '/images/desserts/nutella-pizza.jpg',
    },
  ];

  // SAUCES (Omáčky) - 6 items
  const sauces = [
    {
      name: 'Cesnaková omáčka',
      description: 'Garlic sauce',
      priceCents: 80,
      category: 'SAUCES',
      image: '/images/sauces/garlic.jpg',
    },
    {
      name: 'BBQ omáčka',
      description: 'Barbecue sauce',
      priceCents: 80,
      category: 'SAUCES',
      image: '/images/sauces/bbq.jpg',
    },
    {
      name: 'Sladko-kyslá omáčka',
      description: 'Sweet and sour sauce',
      priceCents: 80,
      category: 'SAUCES',
      image: '/images/sauces/sweet-sour.jpg',
    },
    {
      name: 'Pikantná omáčka',
      description: 'Spicy hot sauce',
      priceCents: 80,
      category: 'SAUCES',
      image: '/images/sauces/hot.jpg',
    },
    {
      name: 'Ranch omáčka',
      description: 'Creamy ranch dressing',
      priceCents: 80,
      category: 'SAUCES',
      image: '/images/sauces/ranch.jpg',
    },
    {
      name: 'Kečup',
      description: 'Tomato ketchup',
      priceCents: 50,
      category: 'SAUCES',
      image: '/images/sauces/ketchup.jpg',
    },
  ];

  // Insert all products (skip if already exists)
  const allProducts = [...drinks, ...sides, ...desserts, ...sauces];
  
  let created = 0;
  let skipped = 0;
  for (const product of allProducts) {
    // Check if product already exists
    const existing = await prisma.product.findFirst({
      where: {
        tenantId: pornopizza.id,
        name: product.name,
      },
    });

    if (existing) {
      console.log(`⏭️  Skipped (exists): ${product.name}`);
      skipped++;
      continue;
    }

    await prisma.product.create({
      data: {
        ...product,
        tenantId: pornopizza.id,
        isActive: true,
        taxRate: 20,
      },
    });
    created++;
    console.log(`✅ Created: ${product.name}`);
  }

  console.log(`\n🎉 Seeding complete!`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Created: ${created}`);
  console.log(`   - Skipped (already exist): ${skipped}`);
  console.log(`   - Drinks: ${drinks.length}`);
  console.log(`   - Sides: ${sides.length}`);
  console.log(`   - Desserts: ${desserts.length}`);
  console.log(`   - Sauces: ${sauces.length}`);
  console.log(`   - Total items: ${allProducts.length}`);
}

seedFullMenu()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

