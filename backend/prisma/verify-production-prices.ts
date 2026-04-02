import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyProductionPrices() {
  console.log('🔍 Verifying product prices in production database...\n');
  console.log('⚠️  Make sure DATABASE_URL points to production database!\n');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found.');
  }

  console.log(`✅ Found tenant: ${pornopizza.name} (${pornopizza.subdomain})\n`);

  // Get products as ProductsService would
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

  console.log('📋 Premium Sins products (should be 11.99, 10.99, 10.99, 11.99):');
  const premiumSins = [
    { name: 'Basil Pesto Premium', expected: 1199 },
    { name: 'Honey Chilli', expected: 1099 },
    { name: 'Pollo Crema', expected: 1099 },
    { name: 'Prosciutto Crudo Premium', expected: 1199 },
  ];
  
  let premiumErrors = 0;
  premiumSins.forEach(({ name, expected }) => {
    const p = products.find(pr => pr.name === name);
    if (p) {
      const isCorrect = p.priceCents === expected;
      const status = isCorrect ? '✅' : '❌';
      console.log(`  ${status} ${p.name}: ${(p.priceCents / 100).toFixed(2)} € (${p.priceCents} cents) - Expected: ${(expected / 100).toFixed(2)} €`);
      if (!isCorrect) premiumErrors++;
    } else {
      console.log(`  ❌ ${name}: NOT FOUND`);
      premiumErrors++;
    }
  });

  console.log('\n📋 DELUXE FETISH products (should all be 10.99):');
  const deluxeFetish = [
    { name: 'Quattro Formaggi', expected: 1099 },
    { name: 'Quattro Formaggi Bianco', expected: 1099 },
    { name: 'Tonno', expected: 1099 },
    { name: 'Vegetariana Premium', expected: 1099 },
    { name: 'Hot Missionary', expected: 1099 },
  ];
  
  let deluxeErrors = 0;
  deluxeFetish.forEach(({ name, expected }) => {
    const p = products.find(pr => pr.name === name);
    if (p) {
      const isCorrect = p.priceCents === expected;
      const status = isCorrect ? '✅' : '❌';
      console.log(`  ${status} ${p.name}: ${(p.priceCents / 100).toFixed(2)} € (${p.priceCents} cents) - Expected: ${(expected / 100).toFixed(2)} €`);
      if (!isCorrect) deluxeErrors++;
    } else {
      console.log(`  ❌ ${name}: NOT FOUND`);
      deluxeErrors++;
    }
  });

  console.log('\n' + '='.repeat(60));
  if (premiumErrors === 0 && deluxeErrors === 0) {
    console.log('✅ All prices are correct in database!');
    console.log('⚠️  If frontend still shows wrong prices:');
    console.log('   1. Restart backend on Render.com');
    console.log('   2. Clear Next.js cache (delete .next folder)');
    console.log('   3. Hard refresh browser (Ctrl+Shift+R)');
  } else {
    console.log(`❌ Found ${premiumErrors + deluxeErrors} price errors!`);
    console.log('💡 Run: npx ts-node prisma/update-prices-descriptions.ts');
  }
  console.log('='.repeat(60));
}

verifyProductionPrices()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

