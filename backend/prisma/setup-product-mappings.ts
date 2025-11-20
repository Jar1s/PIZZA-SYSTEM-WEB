import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupProductMappings() {
  console.log('🔗 Setting up product mappings...');

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!tenant) {
    throw new Error('PornoPizza tenant not found');
  }

  // Mapovanie pre Hawaii
  // Interný názov: "Hawaii" (ako je v databáze)
  // Externé identifikátory: "#69", "Hawaii Premium", "Hawaiian", atď.
  const hawaiiMappings = [
    { external: '#69', internal: 'Hawaii' },
    { external: '69', internal: 'Hawaii' },
    { external: 'Hawaii Premium', internal: 'Hawaii' },
    { external: 'Hawaiian', internal: 'Hawaii' },
    { external: 'Hawaii Deluxe', internal: 'Hawaii' },
    { external: 'Pizza Hawaii', internal: 'Hawaii' },
  ];

  for (const mapping of hawaiiMappings) {
    // Skúsime nájsť existujúce mapovanie
    const existing = await prisma.productMapping.findFirst({
      where: {
        tenantId: tenant.id,
        externalIdentifier: mapping.external,
        source: null,
      },
    });

    if (existing) {
      await prisma.productMapping.update({
        where: { id: existing.id },
        data: {
          internalProductName: mapping.internal,
        },
      });
      console.log(`✏️  Updated mapping: "${mapping.external}" → "${mapping.internal}"`);
    } else {
      await prisma.productMapping.create({
        data: {
          tenantId: tenant.id,
          externalIdentifier: mapping.external,
          internalProductName: mapping.internal,
          source: null,
        },
      });
      console.log(`✅ Created mapping: "${mapping.external}" → "${mapping.internal}"`);
    }
  }

  console.log('\n🎉 Setup complete!');
  console.log('\n📋 Summary:');
  console.log('   - Hawaii product mappings created');
  console.log('   - External identifiers will map to internal name "Hawaii"');
  console.log('   - Do Storyous will be sent: "Hawaii" (internal name)');
}

setupProductMappings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

