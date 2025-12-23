import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listProductsWithImages() {
  console.log('🔍 Checking all products for images...\n');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found.');
  }

  // Use raw SQL to avoid Prisma client schema issues
  const products = await prisma.$queryRaw<Array<{
    name: string;
    category: string;
    image: string | null;
  }>>`
    SELECT name, category, image
    FROM products
    WHERE "tenantId" = ${pornopizza.id}
      AND "isActive" = true
    ORDER BY 
      CASE WHEN image IS NULL OR image = '' THEN 0 ELSE 1 END,
      category,
      name
  `;

  const missingImages = products.filter(p => !p.image || p.image.trim() === '');
  const hasImages = products.filter(p => p.image && p.image.trim() !== '');

  console.log(`📊 Total active products: ${products.length}`);
  console.log(`✅ Products with images: ${hasImages.length}`);
  console.log(`❌ Products missing images: ${missingImages.length}\n`);

  if (missingImages.length > 0) {
    console.log('❌ Products WITHOUT images:');
    console.log('─'.repeat(60));
    
    const byCategory = missingImages.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push(p.name);
      return acc;
    }, {} as Record<string, string[]>);

    for (const [category, names] of Object.entries(byCategory)) {
      console.log(`\n${category}:`);
      names.forEach(name => console.log(`  - ${name}`));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Products WITH images (first 10):');
  console.log('─'.repeat(60));
  
  hasImages.slice(0, 10).forEach(p => {
    console.log(`✓ ${p.name} (${p.category}) → ${p.image}`);
  });
  
  if (hasImages.length > 10) {
    console.log(`... and ${hasImages.length - 10} more`);
  }
}

listProductsWithImages()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






