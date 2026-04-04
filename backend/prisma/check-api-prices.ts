import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkApiPrices() {
  console.log('🔍 Checking product prices in database vs what API should return...\n');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found.');
  }

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

  console.log('📋 Premium Sins products:');
  const premiumSins = ['Basil Pesto Premium', 'Honey Chilli', 'Pollo Crema', 'Prosciutto Crudo Premium'];
  premiumSins.forEach(name => {
    const p = products.find(pr => pr.name === name);
    if (p) {
      console.log(`  ${p.name}: ${(p.priceCents / 100).toFixed(2)} € (${p.priceCents} cents)`);
    } else {
      console.log(`  ${name}: NOT FOUND`);
    }
  });

  console.log('\n📋 DELUXE FETISH products:');
  const deluxeFetish = ['Quattro Formaggi', 'Quattro Formaggi Bianco', 'Tonno', 'Vegetariana Premium', 'Hot Missionary'];
  deluxeFetish.forEach(name => {
    const p = products.find(pr => pr.name === name);
    if (p) {
      console.log(`  ${p.name}: ${(p.priceCents / 100).toFixed(2)} € (${p.priceCents} cents)`);
    } else {
      console.log(`  ${name}: NOT FOUND`);
    }
  });

  console.log('\n✅ These are the prices that the API should return.');
  console.log('⚠️  If frontend shows different prices, it might be:');
  console.log('   1. Backend cache (restart backend)');
  console.log('   2. Next.js cache (clear .next folder)');
  console.log('   3. Browser cache (hard refresh)');
}

checkApiPrices()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

