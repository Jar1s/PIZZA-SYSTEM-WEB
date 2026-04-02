import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDeliveryFeeTiers() {
  console.log('🌱 Seeding delivery fee tiers...');

  // Default global tiers (for all tenants)
  const defaultTiers = [
    {
      tenantId: null, // Global tier
      minDistanceMeters: 0,
      maxDistanceMeters: 3000,
      deliveryFeeCents: 425, // 4.25 EUR
      isActive: true,
      priority: 0,
    },
    {
      tenantId: null,
      minDistanceMeters: 3000,
      maxDistanceMeters: 6000,
      deliveryFeeCents: 450, // 4.50 EUR
      isActive: true,
      priority: 0,
    },
    {
      tenantId: null,
      minDistanceMeters: 6000,
      maxDistanceMeters: 10000,
      deliveryFeeCents: 750, // 7.50 EUR
      isActive: true,
      priority: 0,
    },
    {
      tenantId: null,
      minDistanceMeters: 10000,
      maxDistanceMeters: 15000,
      deliveryFeeCents: 1050, // 10.50 EUR
      isActive: true,
      priority: 0,
    },
  ];

  for (const tier of defaultTiers) {
    const tierId = tier.tenantId
      ? `${tier.tenantId}-${tier.minDistanceMeters}-${tier.maxDistanceMeters}`
      : `global-${tier.minDistanceMeters}-${tier.maxDistanceMeters}`;

    await prisma.deliveryFeeTier.upsert({
      where: {
        id: tierId,
      },
      update: tier,
      create: {
        id: tierId,
        ...tier,
      },
    });
    console.log(`✅ Created/updated tier: ${tier.minDistanceMeters}-${tier.maxDistanceMeters}m = ${tier.deliveryFeeCents / 100}€`);
  }

  console.log('✅ Delivery fee tiers seeded successfully!');
}

seedDeliveryFeeTiers()
  .catch((e) => {
    console.error('❌ Error seeding delivery fee tiers:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
