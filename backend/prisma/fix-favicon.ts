import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixFavicon() {
  console.log('🔧 Fixing favicon paths...');

  // Update pornopizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (pornopizza) {
    const currentTheme = pornopizza.theme as any;
    const updatedTheme = {
      ...currentTheme,
      favicon: '/favicon.ico', // Use default favicon
    };

    await prisma.tenant.update({
      where: { id: pornopizza.id },
      data: {
        theme: updatedTheme,
      },
    });

    console.log('✅ Updated pornopizza favicon path');
  }

  // Update pizzavnudzi tenant
  const pizzavnudzi = await prisma.tenant.findUnique({
    where: { subdomain: 'pizzavnudzi' },
  });

  if (pizzavnudzi) {
    const currentTheme = pizzavnudzi.theme as any;
    const updatedTheme = {
      ...currentTheme,
      favicon: '/favicon.ico', // Use default favicon
    };

    await prisma.tenant.update({
      where: { id: pizzavnudzi.id },
      data: {
        theme: updatedTheme,
      },
    });

    console.log('✅ Updated pizzavnudzi favicon path');
  }

  console.log('\n🎉 Favicon paths fixed!');
}

fixFavicon()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

