import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // PornoPizza
  await prisma.tenant.upsert({
    where: { slug: 'pornopizza' },
    update: {},
    create: {
      slug: 'pornopizza',
      name: 'PornoPizza',
      domain: 'pornopizza.sk',
      subdomain: 'pornopizza',
      theme: {
        primaryColor: '#FF6B00',
        secondaryColor: '#000000',
        logo: '/logos/pornopizza.svg',
        favicon: '/favicons/pornopizza.ico',
        fontFamily: 'Inter',
        layout: {
          headerStyle: 'dark',
          backgroundStyle: 'black',
          useCustomLogo: true,
          customLogoComponent: 'PornoPizzaLogo',
          useCustomBackground: true,
          customBackgroundClass: 'porno-bg',
        },
      },
      paymentConfig: {
        provider: 'adyen',
        merchantAccount: process.env.ADYEN_MERCHANT_PORNOPIZZA || 'TestMerchant',
      },
      deliveryConfig: {
        provider: 'wolt',
        apiKey: process.env.WOLT_API_KEY_PORNOPIZZA || 'test_key',
      },
    },
  });

  // Pizza v Núdzi
  await prisma.tenant.upsert({
    where: { slug: 'pizzavnudzi' },
    update: {},
    create: {
      slug: 'pizzavnudzi',
      name: 'Pizza v Núdzi',
      domain: 'pizzavnudzi.sk',
      subdomain: 'pizzavnudzi',
      theme: {
        primaryColor: '#E63946',
        secondaryColor: '#F1FAEE',
        logo: '/logos/pizzavnudzi.svg',
        favicon: '/favicons/pizzavnudzi.ico',
        fontFamily: 'Poppins',
        layout: {
          headerStyle: 'light',
          backgroundStyle: 'white',
          useCustomLogo: false,
        },
      },
      paymentConfig: {
        provider: 'adyen',
        merchantAccount: process.env.ADYEN_MERCHANT_PIZZAVNUDZI || 'TestMerchant',
      },
      deliveryConfig: {
        provider: 'wolt',
        apiKey: process.env.WOLT_API_KEY_PIZZAVNUDZI || 'test_key',
      },
    },
  });

  console.log('✅ Seeded 2 tenants');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

















