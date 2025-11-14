import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addBuildYourOwnPizza() {
  console.log('🍕 Adding "Vyskladaj si vlastnú pizzu" to PornoPizza menu...');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found.');
  }

  // Check if product already exists
  const existing = await prisma.product.findFirst({
    where: {
      tenantId: pornopizza.id,
      name: 'Vyskladaj si vlastnú pizzu',
      category: 'PIZZA',
    },
  });

  const productData = {
    tenantId: pornopizza.id,
    name: 'Vyskladaj si vlastnú pizzu',
    description: 'Vytvor si vlastnú pizzu podľa svojich predstáv. Vyber si cesto, syr, základ a prílohy.',
    priceCents: 799, // 7.99€ base price
    image: '/images/pizzas/build-your-own.jpg',
    category: 'PIZZA',
    isActive: true,
    taxRate: 20,
    modifiers: {
      // This product uses the customization modal
      // The customization options are defined in frontend/lib/customization-options.ts
      customProduct: true,
    },
  };

  if (existing) {
    // Update existing product
    await prisma.product.update({
      where: { id: existing.id },
      data: productData,
    });
    console.log('✅ Updated: Vyskladaj si vlastnú pizzu');
  } else {
    // Create new product
    await prisma.product.create({
      data: productData as any,
    });
    console.log('✅ Created: Vyskladaj si vlastnú pizzu');
  }

  // Now we need to ensure this product appears first
  // We'll update the createdAt to be earlier than other pizzas
  // First, get the earliest pizza createdAt
  const earliestPizza = await prisma.product.findFirst({
    where: {
      tenantId: pornopizza.id,
      category: 'PIZZA',
      name: { not: 'Vyskladaj si vlastnú pizzu' },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (earliestPizza) {
    // Set createdAt to be 1 second earlier than the earliest pizza
    const earlierDate = new Date(earliestPizza.createdAt);
    earlierDate.setSeconds(earlierDate.getSeconds() - 1);

    const buildYourOwn = await prisma.product.findFirst({
      where: {
        tenantId: pornopizza.id,
        name: 'Vyskladaj si vlastnú pizzu',
        category: 'PIZZA',
      },
    });

    if (buildYourOwn) {
      await prisma.product.update({
        where: { id: buildYourOwn.id },
        data: {
          createdAt: earlierDate,
        },
      });
      console.log('✅ Updated order: Vyskladaj si vlastnú pizzu is now first');
    }
  }

  console.log('\n🎉 Build Your Own Pizza added successfully!');
  console.log('💰 Base price: €7.99');
  console.log('📸 Image: /images/pizzas/build-your-own.jpg');
  console.log('\n💡 Make sure to add the image file to:');
  console.log('   frontend/public/images/pizzas/build-your-own.jpg');
}

addBuildYourOwnPizza()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

