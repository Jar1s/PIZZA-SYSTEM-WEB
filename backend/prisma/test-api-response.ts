import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testApiResponse() {
  console.log('🔍 Testing what ProductsService.getProducts() would return...\n');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found.');
  }

  // Simulate what ProductsService.getProducts() does
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

  console.log(`📦 Total products: ${products.length}\n`);

  // Check Premium Sins products
  console.log('🍑 PREMIUM SINS products:');
  const premiumSins = ['Basil Pesto Premium', 'Honey Chilli', 'Pollo Crema', 'Prosciutto Crudo Premium'];
  premiumSins.forEach(name => {
    const p = products.find(pr => pr.name === name);
    if (p) {
      const price = (p.priceCents / 100).toFixed(2);
      console.log(`  ✅ ${p.name}:`);
      console.log(`     - priceCents: ${p.priceCents}`);
      console.log(`     - price: €${price}`);
      console.log(`     - Expected: ${name === 'Basil Pesto Premium' || name === 'Prosciutto Crudo Premium' ? '€11.99' : '€10.99'}`);
      if ((name === 'Basil Pesto Premium' || name === 'Prosciutto Crudo Premium') && p.priceCents !== 1199) {
        console.log(`     ⚠️  WRONG PRICE! Should be 1199 cents (€11.99)`);
      } else if ((name === 'Honey Chilli' || name === 'Pollo Crema') && p.priceCents !== 1099) {
        console.log(`     ⚠️  WRONG PRICE! Should be 1099 cents (€10.99)`);
      }
    } else {
      console.log(`  ❌ ${name}: NOT FOUND`);
    }
  });

  console.log('\n💋 DELUXE FETISH products:');
  const deluxeFetish = ['Quattro Formaggi', 'Quattro Formaggi Bianco', 'Tonno', 'Vegetariana Premium', 'Hot Missionary'];
  deluxeFetish.forEach(name => {
    const p = products.find(pr => pr.name === name);
    if (p) {
      const price = (p.priceCents / 100).toFixed(2);
      console.log(`  ✅ ${p.name}:`);
      console.log(`     - priceCents: ${p.priceCents}`);
      console.log(`     - price: €${price}`);
      console.log(`     - Expected: €10.99`);
      if (p.priceCents !== 1099) {
        console.log(`     ⚠️  WRONG PRICE! Should be 1099 cents (€10.99)`);
      }
    } else {
      console.log(`  ❌ ${name}: NOT FOUND`);
    }
  });

  console.log('\n📊 Summary:');
  const allChecked = [...premiumSins, ...deluxeFetish];
  const found = allChecked.filter(name => products.some(p => p.name === name));
  const notFound = allChecked.filter(name => !products.some(p => p.name === name));
  console.log(`  Found: ${found.length}/${allChecked.length}`);
  if (notFound.length > 0) {
    console.log(`  Not found: ${notFound.join(', ')}`);
  }
}

testApiResponse()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

