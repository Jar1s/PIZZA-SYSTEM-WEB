import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateLogo() {
  console.log('🎨 Updating to simple logo...');

  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found.');
  }

  const currentTheme = pornopizza.theme as any;

  const updatedTheme = {
    ...currentTheme,
    logo: '/logo-pornopizza-simple.svg',
  };

  await prisma.tenant.update({
    where: { id: pornopizza.id },
    data: {
      theme: updatedTheme,
    },
  });

  console.log('✅ Updated to simple logo!');
  console.log('📁 Logo: /logo-pornopizza-simple.svg');
}

updateLogo()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
