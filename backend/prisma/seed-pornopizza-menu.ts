import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPornoPizzaMenu() {
  console.log('🍕 Seeding PornoPizza menu with pizzas...');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found. Run main seed first.');
  }

  // Note: Not deleting existing products to avoid foreign key issues with orders
  // We'll upsert instead

  // CLASSIC PIZZAS (€7.90 - €10.90)
  const classicPizzas = [
    {
      name: 'Margherita',
      description: 'Classic tomato sauce, mozzarella, fresh basil, olive oil',
      priceCents: 790,
      image: '/images/pizzas/classic/margherita.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Capri',
      description: 'Fresh tomatoes, buffalo mozzarella, cherry tomatoes, basil',
      priceCents: 890,
      image: '/images/pizzas/classic/capri.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Fregata',
      description: 'Seafood special with shrimp, mussels, garlic, white wine sauce',
      priceCents: 1090,
      image: '/images/pizzas/classic/fregata.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Gazdovská',
      description: 'Country style with bacon, onions, peppers, farm cheese',
      priceCents: 950,
      image: '/images/pizzas/classic/gazdovska.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Pivárska',
      description: 'Beer lovers special with sausage, onions, mustard sauce',
      priceCents: 920,
      image: '/images/pizzas/classic/pivarska.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Korpus',
      description: 'Hearty mix of meats, bacon, ham, sausage, pepperoni',
      priceCents: 1050,
      image: '/images/pizzas/classic/korpus.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Štangle Classic',
      description: 'Traditional Slovak style with sausage and local cheese',
      priceCents: 880,
      image: '/images/pizzas/classic/stangle.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Štangle Special',
      description: 'Premium sausage, caramelized onions, mustard cream',
      priceCents: 980,
      image: '/images/pizzas/classic/stangle-2.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Štangle Deluxe',
      description: 'Triple sausage variety with special sauce and herbs',
      priceCents: 1090,
      image: '/images/pizzas/classic/stangle-3.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Prosciutto',
      description: 'Italian ham, mozzarella, tomato sauce, arugula',
      priceCents: 990,
      image: '/images/pizzas/classic/prosciutto.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Quattro Formaggi',
      description: 'Four cheese blend: mozzarella, gorgonzola, parmesan, goat cheese',
      priceCents: 1090,
      image: '/images/pizzas/classic/quattro-formaggi.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Quattro Formaggi Bianco',
      description: 'White pizza with four premium cheeses and cream base',
      priceCents: 1090,
      image: '/images/pizzas/classic/quattro-formaggi-bianco.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Tonno',
      description: 'Tuna, red onions, capers, olives, mozzarella, tomato sauce',
      priceCents: 950,
      image: '/images/pizzas/classic/tonno.jpg',
      category: 'PIZZA',
    },
  ];

  // PREMIUM PIZZAS (€11.90 - €14.90)
  const premiumPizzas = [
    {
      name: 'Basil Pesto Premium',
      description: 'Fresh basil pesto, cherry tomatoes, buffalo mozzarella, pine nuts',
      priceCents: 1290,
      image: '/images/pizzas/premium/basil-pesto.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Bon Salami',
      description: 'Premium salami selection, spicy peppers, aged cheese',
      priceCents: 1390,
      image: '/images/pizzas/premium/bon-salami.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Calimero',
      description: 'Black olive tapenade, cherry tomatoes, feta, fresh herbs',
      priceCents: 1190,
      image: '/images/pizzas/premium/calimero.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Da Vinci',
      description: 'Artist\'s special: prosciutto, arugula, parmesan, balsamic glaze',
      priceCents: 1390,
      image: '/images/pizzas/premium/da-vinci.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Diavola Premium',
      description: 'Extra spicy salami, hot peppers, jalapeños, chili oil',
      priceCents: 1290,
      image: '/images/pizzas/premium/diavola.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Hawaii Premium',
      description: 'Smoked ham, caramelized pineapple, jalapeños, premium cheese',
      priceCents: 1190,
      image: '/images/pizzas/premium/hawaii.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Mayday Special',
      description: 'House special with secret ingredient blend, chef\'s choice toppings',
      priceCents: 1490,
      image: '/images/pizzas/premium/mayday.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Honey Chilli',
      description: 'Sweet and spicy: honey drizzle, chili flakes, salami, peppers',
      priceCents: 1290,
      image: '/images/pizzas/premium/honey-chilli.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Picante',
      description: 'Extra hot with spicy beef, jalapeños, chili peppers, hot sauce',
      priceCents: 1290,
      image: '/images/pizzas/premium/picante.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Pollo Crema',
      description: 'Grilled chicken, cream sauce, mushrooms, parmesan, herbs',
      priceCents: 1390,
      image: '/images/pizzas/premium/pollo-crema.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Prosciutto Crudo Premium',
      description: 'Premium prosciutto di Parma, burrata, cherry tomatoes, arugula',
      priceCents: 1490,
      image: '/images/pizzas/premium/prosciutto-crudo.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Prosciutto Funghi',
      description: 'Italian ham, mixed mushrooms, truffle oil, mozzarella',
      priceCents: 1390,
      image: '/images/pizzas/premium/prosciutto-funghi.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Provinciale',
      description: 'French countryside: brie, walnuts, honey, caramelized onions',
      priceCents: 1390,
      image: '/images/pizzas/premium/provinciale.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Quattro Stagioni',
      description: 'Four seasons in quarters: ham, mushrooms, artichokes, olives',
      priceCents: 1290,
      image: '/images/pizzas/premium/quattro-stagioni.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Vegetariana Premium',
      description: 'Grilled vegetables, sun-dried tomatoes, feta, olives, pesto',
      priceCents: 1190,
      image: '/images/pizzas/premium/vegetariana.jpg',
      category: 'PIZZA',
    },
  ];

  // Insert or update all pizzas
  const allPizzas = [...classicPizzas, ...premiumPizzas];
  
  // First, deactivate all existing products
  await prisma.product.updateMany({
    where: { tenantId: pornopizza.id },
    data: { isActive: false },
  });
  
  // Then create or update each pizza
  for (const pizza of allPizzas) {
    // Try to find existing product by name
    const existing = await prisma.product.findFirst({
      where: {
        tenantId: pornopizza.id,
        name: pizza.name,
      },
    });
    
    if (existing) {
      // Update existing product
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          ...pizza,
          isActive: true,
        },
      });
      console.log(`✏️  Updated: ${pizza.name}`);
    } else {
      // Create new product
      await prisma.product.create({
        data: {
          ...pizza,
          tenantId: pornopizza.id,
          isActive: true,
        },
      });
      console.log(`✅ Created: ${pizza.name}`);
    }
  }

  console.log(`\n🎉 Successfully seeded ${allPizzas.length} pizzas for PornoPizza!`);
  console.log(`📊 Classic: ${classicPizzas.length} | Premium: ${premiumPizzas.length}`);
}

seedPornoPizzaMenu()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

