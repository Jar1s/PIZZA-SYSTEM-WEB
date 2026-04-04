import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeUnwantedProducts() {
  console.log('🗑️  Removing unwanted products from PornoPizza menu...');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found.');
  }

  // List of products to remove (the 12 unwanted ones from SIDES category)
  // Based on user request - remove all SIDES/Appetizers
  const productsToRemove = [
    // All SIDES products (12 items)
    'Ciabatta so šunkou a syrom',
    'Mozzarella sticks 6ks',
    'Chicken Wings 16ks',
    'Chicken Wings 8ks',
    'Cesnaková bageta so syrom',
    'Cesnaková bageta',
    'Caprese šalát',
    'Frytky',
    'Sladké zemiakové frytky',
    'Olivy s cesnakom',
    'Caesar šalát',
    'Zeleninový šalát',
  ];

  console.log(`\n📋 Products to remove: ${productsToRemove.length}`);

  let removedCount = 0;

  for (const productName of productsToRemove) {
    const product = await prisma.product.findFirst({
      where: {
        tenantId: pornopizza.id,
        name: productName,
      },
    });

    if (product) {
      // Deactivate instead of delete to avoid foreign key issues
      await prisma.product.update({
        where: { id: product.id },
        data: { isActive: false },
      });
      console.log(`   ❌ Deactivated: ${productName}`);
      removedCount++;
    } else {
      console.log(`   ⚠️  Not found: ${productName}`);
    }
  }

  // Also remove all products from SIDES category
  const allSidesProducts = await prisma.product.findMany({
    where: {
      tenantId: pornopizza.id,
      category: 'SIDES',
      isActive: true,
    },
  });

  console.log(`\n🔍 Removing all SIDES category products...`);

  for (const product of allSidesProducts) {
    if (!productsToRemove.includes(product.name)) {
      await prisma.product.update({
        where: { id: product.id },
        data: { isActive: false },
      });
      console.log(`   ❌ Deactivated (SIDES category): ${product.name}`);
      removedCount++;
    }
  }

  console.log(`\n✅ Successfully removed/deactivated ${removedCount} products!`);
  console.log(`\n📊 Remaining active products:`);
  
  const remainingProducts = await prisma.product.findMany({
    where: {
      tenantId: pornopizza.id,
      isActive: true,
    },
    select: {
      name: true,
      category: true,
    },
    orderBy: {
      category: 'asc',
    },
  });

  const byCategory = remainingProducts.reduce((acc, product) => {
    const cat = product.category || 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product.name);
    return acc;
  }, {} as Record<string, string[]>);

  for (const [category, names] of Object.entries(byCategory)) {
    console.log(`\n   ${category}: ${names.length} products`);
    names.forEach(name => console.log(`      - ${name}`));
  }

  console.log(`\n📈 Total active products: ${remainingProducts.length}`);
}

removeUnwantedProducts()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

