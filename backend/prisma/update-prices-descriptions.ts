import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePricesAndDescriptions() {
  console.log('💰 Updating pizza prices and descriptions from Mayday Pizza menu...');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found.');
  }

  // Updated pizzas with correct prices and descriptions from menu
  const pizzaUpdates = [
    // Classic Pizzas
    {
      name: 'Margherita',
      priceCents: 799, // 7,99 €
      description: 'Paradajkový základ, mozzarella',
    },
    {
      name: 'Prosciutto',
      priceCents: 999, // 9,99 €
      description: 'Paradajkový základ, mozzarella, šunka',
    },
    {
      name: 'Bon Salami',
      priceCents: 999, // 9,99 €
      description: 'Paradajkový základ, mozzarella, saláma',
    },
    {
      name: 'Picante',
      priceCents: 1099, // 10,99 €
      description: 'Paradajkový základ, mozzarella, pikantná saláma, jalapenos',
    },
    {
      name: 'Calimero',
      priceCents: 1099, // 10,99 €
      description: 'Paradajkový základ, mozzarella, šunka, kukurica',
    },
    {
      name: 'Prosciutto Funghi',
      priceCents: 1099, // 10,99 €
      description: 'Paradajkový základ, mozzarella, šunka, šampiňóny',
    },
    {
      name: 'Hawaii Premium',
      priceCents: 1099, // 10,99 €
      description: 'Paradajkový základ, mozzarella, šunka, ananás',
    },
    {
      name: 'Capri',
      priceCents: 1099, // 10,99 €
      description: 'Paradajkový základ, mozzarella, šunka, kukurica, šampiňóny',
    },
    {
      name: 'Da Vinci',
      priceCents: 1099, // 10,99 €
      description: 'Paradajkový základ, mozzarella, šunka, slanina, niva, olivy',
    },
    {
      name: 'Quattro Stagioni',
      priceCents: 1099, // 10,99 €
      description: 'Paradajkový základ, mozzarella, šunka, šampiňóny, olivy, artičoky',
    },
    {
      name: 'Mayday Special',
      priceCents: 1099, // 10,99 €
      description: 'Paradajkový základ, mozzarella, šunka, slanina, kukurica, vajce',
    },
    {
      name: 'Provinciale',
      priceCents: 1099, // 10,99 €
      description: 'Paradajkový základ, mozzarella, šunka, slanina, kukurica, baranie rohy',
    },
    {
      name: 'Quattro Formaggi',
      priceCents: 1099, // 10,99 €
      description: 'Paradajkový základ, mozzarella, údený syr, niva, parmezán',
    },
    {
      name: 'Quattro Formaggi Bianco',
      priceCents: 1099, // 10,99 €
      description: 'Smetanový základ, mozzarella, údený syr, niva, parmezán',
    },
    {
      name: 'Tonno',
      priceCents: 1099, // 10,99 €
      description: 'Paradajkový základ, mozzarella, tuniak, cibuľa',
    },
    {
      name: 'Vegetariana Premium',
      priceCents: 1099, // 10,99 €
      description: 'Paradajkový základ, mozzarella, brokolica, kukurica, šampiňóny, baby špenát',
    },
    {
      name: 'Fregata',
      priceCents: 1099, // 10,99 €
      description: 'Paradajkový základ, mozzarella, niva, šampiňóny, cibuľa, olivy, vajce',
    },
    {
      name: 'Pivárska',
      priceCents: 1099, // 10,99 €
      description: 'Paradajkový základ, mozzarella, saláma, slanina, klobása, cibuľa, niva',
    },
    {
      name: 'Gazdovská',
      priceCents: 1099, // 10,99 €
      description: 'Paradajkový základ, mozzarella, slanina, cibuľa, šampiňóny, saláma',
    },
    {
      name: 'Honey Chilli',
      priceCents: 1099, // 10,99 €
      description: 'Paradajkový základ, chilli, mozzarella, med, kur.prsia, ananás, oregáno',
    },
    
    // Premium Pizzas
    {
      name: 'Pollo Crema',
      priceCents: 1099, // 10,99 €
      description: 'Smetanový základ, mozzarella, kur.prsia, niva, kukurica, brokolica',
    },
    {
      name: 'Basil Pesto Premium',
      priceCents: 1199, // 11,99 €
      description: 'Paradajkový základ, mozzarella, bazalkové pesto, šunka, ricotta, paradajky, parmezán',
    },
    {
      name: 'Diavola Premium',
      priceCents: 1099, // 10,99 €
      description: 'Paradajkový základ, chilli, mozzarella, pikantná saláma, baranie rohy, jalapenos',
    },
    {
      name: 'Prosciutto Crudo Premium',
      priceCents: 1199, // 11,99 €
      description: 'Paradajkový základ, mozzarella, prosciutto crudo, cherry paradajky, rukola, parmezán',
    },
  ];

  console.log(`\n📋 Updating ${pizzaUpdates.length} pizzas...\n`);

  let updated = 0;
  let notFound = 0;

  for (const update of pizzaUpdates) {
    const product = await prisma.product.findFirst({
      where: {
        tenantId: pornopizza.id,
        name: update.name,
      },
    });

    if (product) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          priceCents: update.priceCents,
          description: update.description,
        },
      });
      console.log(`✅ Updated: ${update.name} - ${(update.priceCents / 100).toFixed(2)} €`);
      updated++;
    } else {
      console.log(`⚠️  Not found: ${update.name}`);
      notFound++;
    }
  }

  console.log(`\n🎉 Successfully updated ${updated} pizzas!`);
  if (notFound > 0) {
    console.log(`⚠️  ${notFound} pizzas not found in database.`);
  }
}

updatePricesAndDescriptions()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

