import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePornoPizzaColor() {
  console.log('🎨 Updating PornoPizza primary color...');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found.');
  }

  // Get current theme
  const currentTheme = pornopizza.theme as any;

  // Update theme with new primary color - more "porn feeling" red/pink
  // Options:
  // #DC143C - Crimson red (classic porn red)
  // #E63946 - Bright red
  // #C41E3A - Dark red
  // #FF1493 - Deep pink
  // #E91E63 - Pink red
  const newPrimaryColor = '#DC143C'; // Crimson red - more "porn feeling"

  const updatedTheme = {
    ...currentTheme,
    primaryColor: newPrimaryColor,
  };

  await prisma.tenant.update({
    where: { id: pornopizza.id },
    data: {
      theme: updatedTheme,
    },
  });

  console.log(`✅ Updated PornoPizza primary color!`);
  console.log(`   Old: ${currentTheme.primaryColor || '#FF6B00'}`);
  console.log(`   New: ${newPrimaryColor} (Crimson Red)`);
  console.log('\n🎉 Color is now updated!');
  console.log('   Hard refresh your browser to see the changes.');
}

updatePornoPizzaColor()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });











