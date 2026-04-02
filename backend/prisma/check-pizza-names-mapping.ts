import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapovanie podľa tabuľky: Pizza original → Web názov
const expectedMappings: Record<string, string> = {
  'Pizza Margherita': 'Margherita Nuda',
  'Pizza Prosciutto': 'Prosciutto Tease',
  'Pizza Bon Salami': 'Salami 69',
  'Pizza Picante': 'Hot Fantasy',
  'Pizza Calimero': 'Calimero Quickie',
  'Pizza Prosciutto Funghi': 'Shroom Affair',
  'Pizza Hawai': 'Hawai Crush',
  'Pizza Capri': 'Corny Love',
  'Pizza Da Vinci': 'Da Vinci Desire',
  'Pizza Quattro Stagioni': 'Mixtape of Sins',
  'Pizza Mayday': 'Mayday Affair',
  'Pizza Provinciale': 'Country Affair',
  'Pizza Quattro Formaggi': 'Four Cheese Fetish',
  'Pizza Quattro Formaggi Bianco': 'White Dream',
  'Pizza Tuniaková': 'Tuna Affair',
  'Pizza Vegetariana': 'Veggie Pleasure',
  'Pizza Fregata': 'Fregata Missionary',
  'Pizza Diavola': 'Hot Dominant',
  'Pizza Pivárska': 'Hotline Pizza',
  'Pizza Gazdovská': 'Gazda Deluxe',
  'Pizza Bazila Pesto': 'Pesto Affair',
  'Pizza Med-Chilli': 'Honey Temptation',
  'Pizza Pollo Crema': 'Pollo Creamy Dream',
  'Pizza Prosciutto Crudo': 'Crudo Affair',
};

// Mapovanie keys v product-translations.ts (ako sú uložené v súbore)
const translationKeys: Record<string, string> = {
  'Margherita': 'Margherita Nuda',
  'Prosciutto': 'Prosciutto Tease',
  'Bon Salami': 'Salami 69',
  'Picante': 'Hot Fantasy',
  'Calimero': 'Calimero Quickie',
  'Prosciutto Funghi': 'Shroom Affair',
  'Hawaii Premium': 'Hawai Crush',
  'Hawaii': 'Hawai Crush',
  'Capri': 'Corny Love',
  'Da Vinci': 'Da Vinci Desire',
  'Quattro Stagioni': 'Mixtape of Sins',
  'Mayday': 'Mayday Affair', // CHÝBA v product-translations.ts
  'Provinciale': 'Country Affair',
  'Quattro Formaggi': 'Four Cheese Fetish',
  'Quattro Formaggi Bianco': 'White Dream',
  'Tonno': 'Tuna Affair',
  'Vegetariana Premium': 'Veggie Pleasure',
  'Fregata': 'Fregata Missionary', // TERAZ: 'Pizza Fregata', MALO BY: 'Fregata Missionary'
  'Diavola Premium': 'Hot Dominant', // TERAZ: 'Diavola Dominant', MALO BY: 'Hot Dominant'
  'Diavola': 'Hot Dominant',
  'Pivárska': 'Hotline Pizza', // TERAZ: 'Pizza Pivárska', MALO BY: 'Hotline Pizza'
  'Gazdovská': 'Gazda Deluxe',
  'Basil Pesto Premium': 'Pesto Affair',
  'Honey Chilli': 'Honey Temptation',
  'Pollo Crema': 'Pollo Creamy Dream',
  'Prosciutto Crudo Premium': 'Crudo Affair',
};

async function checkPizzaNamesMapping() {
  console.log('🔍 Kontrola mapovania názvov pizze v databáze...\n');

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!tenant) {
    throw new Error('PornoPizza tenant not found');
  }

  const products = await prisma.product.findMany({
    where: {
      tenantId: tenant.id,
      category: 'PIZZA',
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      isActive: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  console.log(`📋 Našiel som ${products.length} aktívnych pizze v databáze\n`);
  console.log('─'.repeat(80));

  const issues: Array<{ dbName: string; expectedWeb: string; currentWeb?: string; issue: string }> = [];

  for (const product of products) {
    const dbName = product.name;
    
    // Skúsiť nájsť mapovanie
    let expectedWeb: string | undefined;
    let translationKey: string | undefined;
    
    // Skontrolovať, či názov začína "Pizza "
    if (dbName.startsWith('Pizza ')) {
      const nameWithoutPizza = dbName.substring(6); // Odstrániť "Pizza "
      expectedWeb = expectedMappings[dbName];
      translationKey = nameWithoutPizza;
    } else {
      // Názov bez "Pizza " prefixu
      expectedWeb = expectedMappings[`Pizza ${dbName}`];
      translationKey = dbName;
    }
    
    // Skontrolovať aj alternatívne názvy
    if (!expectedWeb) {
      // Skúsiť nájsť v translationKeys
      const webName = translationKeys[dbName] || translationKeys[translationKey || ''];
      if (webName) {
        expectedWeb = webName;
      }
    }

    if (expectedWeb) {
      const currentWeb = translationKeys[translationKey || dbName];
      if (currentWeb && currentWeb !== expectedWeb) {
        issues.push({
          dbName,
          expectedWeb,
          currentWeb,
          issue: `❌ NESPRÁVNE: Teraz mapuje na "${currentWeb}", malo by byť "${expectedWeb}"`,
        });
      } else if (!currentWeb) {
        issues.push({
          dbName,
          expectedWeb,
          issue: `⚠️ CHÝBA mapovanie v product-translations.ts pre key: "${translationKey || dbName}"`,
        });
      } else {
        console.log(`✅ ${dbName} → ${expectedWeb}`);
      }
    } else {
      console.log(`❓ ${dbName} → (žiadne mapovanie v tabuľke)`);
    }
  }

  console.log('\n─'.repeat(80));
  
  if (issues.length > 0) {
    console.log(`\n⚠️  Našiel som ${issues.length} problémov:\n`);
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.dbName}`);
      console.log(`   ${issue.issue}`);
      if (issue.currentWeb) {
        console.log(`   Aktuálne: ${issue.currentWeb}`);
      }
      console.log(`   Očakávané: ${issue.expectedWeb}\n`);
    });
  } else {
    console.log('\n✅ Všetky názvy sú správne namapované!');
  }

  console.log('\n📝 Zoznam všetkých pizze v databáze:');
  products.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.name}`);
  });
}

checkPizzaNamesMapping()
  .catch((e) => {
    console.error('❌ Chyba:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

