import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  
  if (tenants.length === 0) {
    console.log('⚠️  No tenants found. Run seed.ts first.');
    return;
  }

  console.log(`📦 Seeding products for ${tenants.length} tenants...`);

  for (const tenant of tenants) {
    console.log(`\n🍕 Adding products for ${tenant.name}...`);

    const products = [
      // Classic Pizzas
      {
        tenantId: tenant.id,
        name: 'Margherita',
        description: 'Classic tomato sauce, mozzarella, fresh basil',
        priceCents: 890,
        category: 'Pizzas',
        image: '/images/margherita.jpg',
        isActive: true,
        modifiers: JSON.stringify([
          {
            id: 'size',
            name: 'Size',
            required: true,
            options: [
              { id: 'small', name: 'Small 25cm', priceCents: 0 },
              { id: 'medium', name: 'Medium 32cm', priceCents: 200 },
              { id: 'large', name: 'Large 40cm', priceCents: 400 },
            ],
          },
          {
            id: 'extras',
            name: 'Extra Toppings',
            required: false,
            options: [
              { id: 'cheese', name: 'Extra Cheese', priceCents: 150 },
              { id: 'mushrooms', name: 'Mushrooms', priceCents: 100 },
              { id: 'olives', name: 'Olives', priceCents: 100 },
            ],
          },
        ]),
      },
      {
        tenantId: tenant.id,
        name: 'Pepperoni',
        description: 'Tomato sauce, mozzarella, spicy pepperoni',
        priceCents: 1090,
        category: 'Pizzas',
        image: '/images/pepperoni.jpg',
        isActive: true,
        modifiers: JSON.stringify([
          {
            id: 'size',
            name: 'Size',
            required: true,
            options: [
              { id: 'small', name: 'Small 25cm', priceCents: 0 },
              { id: 'medium', name: 'Medium 32cm', priceCents: 200 },
              { id: 'large', name: 'Large 40cm', priceCents: 400 },
            ],
          },
          {
            id: 'spicy',
            name: 'Spiciness',
            required: false,
            options: [
              { id: 'mild', name: 'Mild', priceCents: 0 },
              { id: 'medium', name: 'Medium Hot', priceCents: 0 },
              { id: 'hot', name: 'Extra Hot', priceCents: 50 },
            ],
          },
        ]),
      },
      {
        tenantId: tenant.id,
        name: 'Hawaiian',
        description: 'Tomato sauce, mozzarella, ham, pineapple',
        priceCents: 990,
        category: 'Pizzas',
        image: '/images/hawaiian.jpg',
        isActive: true,
        modifiers: JSON.stringify([
          {
            id: 'size',
            name: 'Size',
            required: true,
            options: [
              { id: 'small', name: 'Small 25cm', priceCents: 0 },
              { id: 'medium', name: 'Medium 32cm', priceCents: 200 },
              { id: 'large', name: 'Large 40cm', priceCents: 400 },
            ],
          },
        ]),
      },
      {
        tenantId: tenant.id,
        name: 'Quattro Formaggi',
        description: 'Four cheese blend: mozzarella, gorgonzola, parmesan, ricotta',
        priceCents: 1190,
        category: 'Pizzas',
        image: '/images/quattro-formaggi.jpg',
        isActive: true,
        modifiers: JSON.stringify([
          {
            id: 'size',
            name: 'Size',
            required: true,
            options: [
              { id: 'small', name: 'Small 25cm', priceCents: 0 },
              { id: 'medium', name: 'Medium 32cm', priceCents: 200 },
              { id: 'large', name: 'Large 40cm', priceCents: 400 },
            ],
          },
        ]),
      },
      {
        tenantId: tenant.id,
        name: 'Diavola',
        description: 'Spicy salami, mozzarella, chili peppers',
        priceCents: 1090,
        category: 'Pizzas',
        image: '/images/diavola.jpg',
        isActive: true,
        modifiers: JSON.stringify([
          {
            id: 'size',
            name: 'Size',
            required: true,
            options: [
              { id: 'small', name: 'Small 25cm', priceCents: 0 },
              { id: 'medium', name: 'Medium 32cm', priceCents: 200 },
              { id: 'large', name: 'Large 40cm', priceCents: 400 },
            ],
          },
        ]),
      },
      {
        tenantId: tenant.id,
        name: 'Vegetariana',
        description: 'Grilled vegetables, mozzarella, fresh herbs',
        priceCents: 1050,
        category: 'Pizzas',
        image: '/images/vegetariana.jpg',
        isActive: true,
        modifiers: JSON.stringify([
          {
            id: 'size',
            name: 'Size',
            required: true,
            options: [
              { id: 'small', name: 'Small 25cm', priceCents: 0 },
              { id: 'medium', name: 'Medium 32cm', priceCents: 200 },
              { id: 'large', name: 'Large 40cm', priceCents: 400 },
            ],
          },
        ]),
      },

      // Drinks
      {
        tenantId: tenant.id,
        name: 'Coca Cola',
        description: '500ml bottle',
        priceCents: 250,
        category: 'Drinks',
        image: '/images/coca-cola.jpg',
        isActive: true,
        modifiers: JSON.stringify([]),
      },
      {
        tenantId: tenant.id,
        name: 'Sprite',
        description: '500ml bottle',
        priceCents: 250,
        category: 'Drinks',
        image: '/images/sprite.jpg',
        isActive: true,
        modifiers: JSON.stringify([]),
      },
      {
        tenantId: tenant.id,
        name: 'Orange Juice',
        description: 'Fresh squeezed 330ml',
        priceCents: 350,
        category: 'Drinks',
        image: '/images/orange-juice.jpg',
        isActive: true,
        modifiers: JSON.stringify([]),
      },

      // Desserts
      {
        tenantId: tenant.id,
        name: 'Tiramisu',
        description: 'Classic Italian dessert with coffee and mascarpone',
        priceCents: 550,
        category: 'Desserts',
        image: '/images/tiramisu.jpg',
        isActive: true,
        modifiers: JSON.stringify([]),
      },
      {
        tenantId: tenant.id,
        name: 'Panna Cotta',
        description: 'Vanilla cream with berry sauce',
        priceCents: 490,
        category: 'Desserts',
        image: '/images/panna-cotta.jpg',
        isActive: true,
        modifiers: JSON.stringify([]),
      },

      // Sides
      {
        tenantId: tenant.id,
        name: 'Garlic Bread',
        description: 'Fresh baked with garlic butter and herbs',
        priceCents: 390,
        category: 'Sides',
        image: '/images/garlic-bread.jpg',
        isActive: true,
        modifiers: JSON.stringify([
          {
            id: 'cheese',
            name: 'Add Cheese',
            required: false,
            options: [
              { id: 'with-cheese', name: 'With Mozzarella', priceCents: 100 },
            ],
          },
        ]),
      },
      {
        tenantId: tenant.id,
        name: 'Caesar Salad',
        description: 'Romaine lettuce, parmesan, croutons, Caesar dressing',
        priceCents: 650,
        category: 'Sides',
        image: '/images/caesar-salad.jpg',
        isActive: true,
        modifiers: JSON.stringify([
          {
            id: 'protein',
            name: 'Add Protein',
            required: false,
            options: [
              { id: 'chicken', name: 'Grilled Chicken', priceCents: 200 },
              { id: 'shrimp', name: 'Shrimp', priceCents: 300 },
            ],
          },
        ]),
      },
    ];

    await prisma.product.createMany({
      data: products,
    });

    console.log(`   ✅ Added ${products.length} products`);
  }

  console.log('\n🎉 Product seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding products:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
