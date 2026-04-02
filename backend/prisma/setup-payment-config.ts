/**
 * Script na nastavenie payment configu pre tenant
 * 
 * Použitie:
 *   npx ts-node prisma/setup-payment-config.ts pornopizza
 * 
 * Alebo nastav environment variables:
 *   ADYEN_API_KEY=...
 *   ADYEN_MERCHANT_ACCOUNT=...
 *   ADYEN_ENVIRONMENT=TEST
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenantSlug = process.argv[2] || 'pornopizza';
  
  // Získaj hodnoty z environment variables alebo použij defaults
  const apiKey = process.env.ADYEN_API_KEY;
  const merchantAccount = process.env.ADYEN_MERCHANT_ACCOUNT;
  const environment = process.env.ADYEN_ENVIRONMENT || 'TEST';
  const paymentProvider = process.env.PAYMENT_PROVIDER || 'adyen';

  if (!apiKey || !merchantAccount) {
    console.error('❌ Chýbajú environment variables!');
    console.error('');
    console.error('Nastav v .env alebo ako environment variables:');
    console.error('  ADYEN_API_KEY=...');
    console.error('  ADYEN_MERCHANT_ACCOUNT=...');
    console.error('  ADYEN_ENVIRONMENT=TEST (voliteľné, default: TEST)');
    console.error('  PAYMENT_PROVIDER=adyen (voliteľné, default: adyen)');
    console.error('');
    console.error('Príklad:');
    console.error('  ADYEN_API_KEY=AQE... npx ts-node prisma/setup-payment-config.ts pornopizza');
    process.exit(1);
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      console.error(`❌ Tenant "${tenantSlug}" nebol nájdený!`);
      process.exit(1);
    }

    const paymentConfig = {
      apiKey,
      merchantAccount,
      environment,
    };

    await prisma.tenant.update({
      where: { slug: tenantSlug },
      data: {
        paymentProvider,
        paymentConfig: paymentConfig as any,
      },
    });

    console.log(`✅ Payment config úspešne nastavený pre "${tenantSlug}"`);
    console.log('');
    console.log('Nastavené hodnoty:');
    console.log(`  Payment Provider: ${paymentProvider}`);
    console.log(`  API Key: ${apiKey.substring(0, 10)}...`);
    console.log(`  Merchant Account: ${merchantAccount}`);
    console.log(`  Environment: ${environment}`);
    console.log('');
    console.log('⚠️  Teraz reštartuj backend, aby sa zmeny prejavili!');
  } catch (error) {
    console.error('❌ Chyba pri nastavovaní payment configu:', error);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('❌ Neočakávaná chyba:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

