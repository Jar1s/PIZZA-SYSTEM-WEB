import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌍 Seeding delivery zones for Bratislava...');

  // Get tenant ID (assuming pornopizza tenant exists)
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'pornopizza' },
  });

  if (!tenant) {
    console.error('❌ Tenant "pornopizza" not found. Please create tenant first.');
    return;
  }

  // ZONA1 - Staré Mesto (centrum) - ZADARMO doprava, bez minima
  await prisma.deliveryZone.upsert({
    where: { id: 'zona1-stare-mesto' },
    update: {},
    create: {
      id: 'zona1-stare-mesto',
      tenantId: tenant.id,
      name: 'ZONA1 - Staré Mesto',
      deliveryFeeCents: 0, // ZADARMO
      minOrderCents: null,
      postalCodes: ['81101', '81102', '81103', '81104', '81105', '81106', '81107', '81108', '81109'],
      cityNames: ['Bratislava'],
      cityParts: ['Staré Mesto', 'Stare Mesto', 'Staré mesto'],
      isActive: true,
      priority: 20,
    },
  });

  // ZONA2 - Petržalka - ZADARMO doprava, bez minima
  await prisma.deliveryZone.upsert({
    where: { id: 'zona2-petrzalka' },
    update: {},
    create: {
      id: 'zona2-petrzalka',
      tenantId: tenant.id,
      name: 'ZONA2 - Petržalka',
      deliveryFeeCents: 0, // ZADARMO
      minOrderCents: null,
      postalCodes: ['85101', '85102', '85103', '85104', '85105', '85106', '85107'],
      cityNames: ['Bratislava'],
      cityParts: ['Petržalka', 'Petrzalka'],
      isActive: true,
      priority: 20,
    },
  });

  // ZONA3 - Ružinov - ZADARMO doprava, bez minima
  await prisma.deliveryZone.upsert({
    where: { id: 'zona3-ruzinov' },
    update: {},
    create: {
      id: 'zona3-ruzinov',
      tenantId: tenant.id,
      name: 'ZONA3 - Ružinov',
      deliveryFeeCents: 0, // ZADARMO
      minOrderCents: null,
      postalCodes: ['82101', '82102', '82103', '82104', '82105', '82106', '82107', '82108', '82109'],
      cityNames: ['Bratislava'],
      cityParts: ['Ružinov', 'Ruzinov', 'Nivy', 'Pošeň', 'Ostredky', 'Trávniky', 'Štrkovec', 'Vlčie hrdlo', 'Trnávka'],
      isActive: true,
      priority: 20,
    },
  });

  // ZONA4 - Nové Mesto - ZADARMO doprava, bez minima
  await prisma.deliveryZone.upsert({
    where: { id: 'zona4-nove-mesto' },
    update: {},
    create: {
      id: 'zona4-nove-mesto',
      tenantId: tenant.id,
      name: 'ZONA4 - Nové Mesto',
      deliveryFeeCents: 0, // ZADARMO
      minOrderCents: null,
      postalCodes: ['83101', '83102', '83103', '83104', '83105', '83106', '83107', '83108'],
      cityNames: ['Bratislava'],
      cityParts: ['Nové Mesto', 'Nove Mesto', 'Ahoj', 'Jurajov dvor', 'Koliba', 'Kramáre', 'Kramare', 'Mierová kolónia', 'Mierova kolonia', 'Pasienky', 'Vinohrady'],
      isActive: true,
      priority: 20,
    },
  });

  // ZONA5 - Karlova Ves - ZADARMO doprava, bez minima
  await prisma.deliveryZone.upsert({
    where: { id: 'zona5-karlova-ves' },
    update: {},
    create: {
      id: 'zona5-karlova-ves',
      tenantId: tenant.id,
      name: 'ZONA5 - Karlova Ves',
      deliveryFeeCents: 0, // ZADARMO
      minOrderCents: null,
      postalCodes: ['84101', '84102', '84103', '84104', '84105'],
      cityNames: ['Bratislava'],
      cityParts: ['Karlova Ves', 'Karlova ves'],
      isActive: true,
      priority: 20,
    },
  });

  // ZONA6 - Dúbravka - ZADARMO doprava, bez minima
  await prisma.deliveryZone.upsert({
    where: { id: 'zona6-dubravka' },
    update: {},
    create: {
      id: 'zona6-dubravka',
      tenantId: tenant.id,
      name: 'ZONA6 - Dúbravka',
      deliveryFeeCents: 0, // ZADARMO
      minOrderCents: null,
      postalCodes: ['84106', '84107', '84108'],
      cityNames: ['Bratislava'],
      cityParts: ['Dúbravka', 'Dubravka'],
      isActive: true,
      priority: 20,
    },
  });

  // ZONA7 - Rača - ZADARMO doprava, bez minima
  await prisma.deliveryZone.upsert({
    where: { id: 'zona7-raca' },
    update: {},
    create: {
      id: 'zona7-raca',
      tenantId: tenant.id,
      name: 'ZONA7 - Rača',
      deliveryFeeCents: 0, // ZADARMO
      minOrderCents: null,
      postalCodes: ['83109', '83110', '83111', '83112'],
      cityNames: ['Bratislava'],
      cityParts: ['Rača', 'Raca', 'Krasňany', 'Krasnany', 'Východné', 'Vychodne', 'Žabí majer', 'Zabi majer'],
      isActive: true,
      priority: 20,
    },
  });

  // ZONA8 - Vrakuňa - ZADARMO doprava, bez minima
  await prisma.deliveryZone.upsert({
    where: { id: 'zona8-vrakuna' },
    update: {},
    create: {
      id: 'zona8-vrakuna',
      tenantId: tenant.id,
      name: 'ZONA8 - Vrakuňa',
      deliveryFeeCents: 0, // ZADARMO
      minOrderCents: null,
      postalCodes: ['82110', '82111', '82112'],
      cityNames: ['Bratislava'],
      cityParts: ['Vrakuňa', 'Vrakuna', 'Dolné hony', 'Dolne hony'],
      isActive: true,
      priority: 20,
    },
  });

  // ZONA9 - Podunajské Biskupice - ZADARMO doprava, bez minima
  await prisma.deliveryZone.upsert({
    where: { id: 'zona9-podunajske-biskupice' },
    update: {},
    create: {
      id: 'zona9-podunajske-biskupice',
      tenantId: tenant.id,
      name: 'ZONA9 - Podunajské Biskupice',
      deliveryFeeCents: 0, // ZADARMO
      minOrderCents: null,
      postalCodes: ['82113', '82114', '82115'],
      cityNames: ['Bratislava'],
      cityParts: ['Podunajské Biskupice', 'Podunajske Biskupice', 'Ketelec', 'Lieskovec', 'Medzi jarkami'],
      isActive: true,
      priority: 20,
    },
  });

  // ZONA10 - Lamač - ZADARMO doprava, bez minima
  await prisma.deliveryZone.upsert({
    where: { id: 'zona10-lamac' },
    update: {},
    create: {
      id: 'zona10-lamac',
      tenantId: tenant.id,
      name: 'ZONA10 - Lamač',
      deliveryFeeCents: 0, // ZADARMO
      minOrderCents: null,
      postalCodes: ['84109', '84110'],
      cityNames: ['Bratislava'],
      cityParts: ['Lamač', 'Lamac'],
      isActive: true,
      priority: 20,
    },
  });

  // ZONA11 - Devín - ZADARMO doprava, bez minima
  await prisma.deliveryZone.upsert({
    where: { id: 'zona11-devin' },
    update: {},
    create: {
      id: 'zona11-devin',
      tenantId: tenant.id,
      name: 'ZONA11 - Devín',
      deliveryFeeCents: 0, // ZADARMO
      minOrderCents: null,
      postalCodes: ['84111', '84112'],
      cityNames: ['Bratislava'],
      cityParts: ['Devín', 'Devin'],
      isActive: true,
      priority: 20,
    },
  });

  // ZONA12 - Devínska Nová Ves - ZADARMO doprava, bez minima
  await prisma.deliveryZone.upsert({
    where: { id: 'zona12-devinska-nova-ves' },
    update: {},
    create: {
      id: 'zona12-devinska-nova-ves',
      tenantId: tenant.id,
      name: 'ZONA12 - Devínska Nová Ves',
      deliveryFeeCents: 0, // ZADARMO
      minOrderCents: null,
      postalCodes: ['84113', '84114'],
      cityNames: ['Bratislava'],
      cityParts: ['Devínska Nová Ves', 'Devinska Nova Ves'],
      isActive: true,
      priority: 20,
    },
  });

  // ZONA13 - Záhorská Bystrica - ZADARMO doprava, bez minima
  await prisma.deliveryZone.upsert({
    where: { id: 'zona13-zahorska-bystrica' },
    update: {},
    create: {
      id: 'zona13-zahorska-bystrica',
      tenantId: tenant.id,
      name: 'ZONA13 - Záhorská Bystrica',
      deliveryFeeCents: 0, // ZADARMO
      minOrderCents: null,
      postalCodes: ['84115', '84116'],
      cityNames: ['Bratislava'],
      cityParts: ['Záhorská Bystrica', 'Zahorska Bystrica'],
      isActive: true,
      priority: 20,
    },
  });

  // ZONA14 - Vajnory - ZADARMO doprava, bez minima
  await prisma.deliveryZone.upsert({
    where: { id: 'zona14-vajnory' },
    update: {},
    create: {
      id: 'zona14-vajnory',
      tenantId: tenant.id,
      name: 'ZONA14 - Vajnory',
      deliveryFeeCents: 0, // ZADARMO
      minOrderCents: null,
      postalCodes: ['83113', '83114'],
      cityNames: ['Bratislava'],
      cityParts: ['Vajnory'],
      isActive: true,
      priority: 20,
    },
  });

  // ZONA15 - Jarovce - ZADARMO doprava, minimum 30€
  await prisma.deliveryZone.upsert({
    where: { id: 'zona15-jarovce' },
    update: {},
    create: {
      id: 'zona15-jarovce',
      tenantId: tenant.id,
      name: 'ZONA15 - Jarovce',
      deliveryFeeCents: 0, // ZADARMO
      minOrderCents: 3000, // 30€ minimum
      postalCodes: ['85108', '85109'],
      cityNames: ['Bratislava'],
      cityParts: ['Jarovce'],
      isActive: true,
      priority: 30, // Najvyššia priorita - kontroluje sa najskôr
    },
  });

  // ZONA16 - Rusovce - ZADARMO doprava, minimum 30€
  await prisma.deliveryZone.upsert({
    where: { id: 'zona16-rusovce' },
    update: {},
    create: {
      id: 'zona16-rusovce',
      tenantId: tenant.id,
      name: 'ZONA16 - Rusovce',
      deliveryFeeCents: 0, // ZADARMO
      minOrderCents: 3000, // 30€ minimum
      postalCodes: ['85110', '85111'],
      cityNames: ['Bratislava'],
      cityParts: ['Rusovce'],
      isActive: true,
      priority: 30,
    },
  });

  // ZONA17 - Čunovo - ZADARMO doprava, minimum 30€
  await prisma.deliveryZone.upsert({
    where: { id: 'zona17-cunovo' },
    update: {},
    create: {
      id: 'zona17-cunovo',
      tenantId: tenant.id,
      name: 'ZONA17 - Čunovo',
      deliveryFeeCents: 0, // ZADARMO
      minOrderCents: 3000, // 30€ minimum
      postalCodes: ['85112', '85113'],
      cityNames: ['Bratislava'],
      cityParts: ['Čunovo', 'Cunovo'],
      isActive: true,
      priority: 30,
    },
  });

  console.log('✅ Delivery zones seeded successfully!');
  console.log('\n📋 Created zones for Bratislava:');
  console.log('  ✅ ZONA1 - Staré Mesto: ZADARMO, bez minima');
  console.log('  ✅ ZONA2 - Petržalka: ZADARMO, bez minima');
  console.log('  ✅ ZONA3 - Ružinov: ZADARMO, bez minima');
  console.log('  ✅ ZONA4 - Nové Mesto: ZADARMO, bez minima');
  console.log('  ✅ ZONA5 - Karlova Ves: ZADARMO, bez minima');
  console.log('  ✅ ZONA6 - Dúbravka: ZADARMO, bez minima');
  console.log('  ✅ ZONA7 - Rača: ZADARMO, bez minima');
  console.log('  ✅ ZONA8 - Vrakuňa: ZADARMO, bez minima');
  console.log('  ✅ ZONA9 - Podunajské Biskupice: ZADARMO, bez minima');
  console.log('  ✅ ZONA10 - Lamač: ZADARMO, bez minima');
  console.log('  ✅ ZONA11 - Devín: ZADARMO, bez minima');
  console.log('  ✅ ZONA12 - Devínska Nová Ves: ZADARMO, bez minima');
  console.log('  ✅ ZONA13 - Záhorská Bystrica: ZADARMO, bez minima');
  console.log('  ✅ ZONA14 - Vajnory: ZADARMO, bez minima');
  console.log('  ⚠️  ZONA15 - Jarovce: ZADARMO, minimum 30€');
  console.log('  ⚠️  ZONA16 - Rusovce: ZADARMO, minimum 30€');
  console.log('  ⚠️  ZONA17 - Čunovo: ZADARMO, minimum 30€');
  console.log('\n💡 Total: 17 delivery zones - VŠETKY ZADARMO!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding delivery zones:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
