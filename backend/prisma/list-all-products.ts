import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAllProducts() {
  console.log('📋 Listing all active products in database...\n');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found.');
  }

  // Get all active products
  const products = await prisma.product.findMany({
    where: {
      tenantId: pornopizza.id,
      isActive: true,
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' },
    ],
  });

  // Group by category
  const productsByCategory = products.reduce((acc, product) => {
    const category = product.category || 'OTHER';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, typeof products>);

  // Display by category
  const categoryOrder = ['PIZZA', 'STANGLE', 'SOUPS', 'DRINKS', 'DESSERTS', 'SAUCES', 'SIDES'];
  const categoryEmoji: Record<string, string> = {
    PIZZA: '🍕',
    STANGLE: '🥖',
    SOUPS: '🍲',
    DRINKS: '🥤',
    DESSERTS: '🍰',
    SAUCES: '🍯',
    SIDES: '🍽️',
  };

  let totalCount = 0;

  for (const category of categoryOrder) {
    const categoryProducts = productsByCategory[category] || [];
    if (categoryProducts.length === 0) continue;

    const emoji = categoryEmoji[category] || '📦';
    console.log(`${emoji} ${category} (${categoryProducts.length} produktov):`);
    console.log('─'.repeat(60));

    categoryProducts.forEach((product, index) => {
      const price = (product.priceCents / 100).toFixed(2);
      console.log(`   ${index + 1}. ${product.name} - €${price}`);
      if (product.description) {
        console.log(`      ${product.description}`);
      }
    });

    console.log('');
    totalCount += categoryProducts.length;
  }

  // Show any other categories
  const otherCategories = Object.keys(productsByCategory).filter(
    cat => !categoryOrder.includes(cat)
  );

  if (otherCategories.length > 0) {
    console.log('📦 OSTATNÉ KATEGÓRIE:');
    console.log('─'.repeat(60));
    for (const category of otherCategories) {
      const categoryProducts = productsByCategory[category] || [];
      console.log(`\n${category} (${categoryProducts.length} produktov):`);
      categoryProducts.forEach((product, index) => {
        const price = (product.priceCents / 100).toFixed(2);
        console.log(`   ${index + 1}. ${product.name} - €${price}`);
      });
      totalCount += categoryProducts.length;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 CELKOM: ${totalCount} aktívnych produktov`);
  console.log('='.repeat(60));

  // Summary by category
  console.log('\n📈 Súhrn podľa kategórií:');
  for (const category of categoryOrder) {
    const count = productsByCategory[category]?.length || 0;
    if (count > 0) {
      const emoji = categoryEmoji[category] || '📦';
      console.log(`   ${emoji} ${category}: ${count} produktov`);
    }
  }
}

listAllProducts()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });









