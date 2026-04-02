import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addHotMissionary() {
  console.log('🔥 Adding Hot Missionary product...');

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
      name: 'Hot Missionary',
    },
  });

  if (existing) {
    console.log('✅ Hot Missionary already exists, updating...');
    await prisma.product.update({
      where: { id: existing.id },
      data: {
        priceCents: 1099, // 10,99 €
        description: 'Paradajkový základ, mozzarella, šunka, šampiňóny, feferóny – klasika, ale s poriadnou iskrou.',
        category: 'PIZZA',
        isActive: true,
      },
    });
    console.log('✅ Updated Hot Missionary');
  } else {
    await prisma.product.create({
      data: {
        tenantId: pornopizza.id,
        name: 'Hot Missionary',
        description: 'Paradajkový základ, mozzarella, šunka, šampiňóny, feferóny – klasika, ale s poriadnou iskrou.',
        priceCents: 1099, // 10,99 €
        category: 'PIZZA',
        isActive: true,
      },
    });
    console.log('✅ Created Hot Missionary');
  }
}

addHotMissionary()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

