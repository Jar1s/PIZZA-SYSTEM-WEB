import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addLogo() {
  console.log('🎨 Adding logo to PornoPizza...');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found.');
  }

  // Get current theme
  const currentTheme = pornopizza.theme as any;

  // Update theme with logo
  const updatedTheme = {
    ...currentTheme,
    logo: '/logo-pornopizza-clean.svg',
  };

  await prisma.tenant.update({
    where: { id: pornopizza.id },
    data: {
      theme: updatedTheme,
    },
  });

  console.log('✅ Logo added to tenant theme!');
  console.log(`📁 Logo path: /logo-pornopizza-clean.svg`);
  console.log('\n🎉 Logo is now active on the website!');
  console.log('   Hard refresh your browser to see it.');
}

addLogo()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

