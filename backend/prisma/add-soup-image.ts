import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSoupImage() {
  console.log('🍲 Adding image to Paradajková polievka...');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found.');
  }

  // Find the soup product
  const soup = await prisma.product.findFirst({
    where: {
      tenantId: pornopizza.id,
      name: 'Paradajková polievka',
      category: 'SOUPS',
    },
  });

  if (!soup) {
    console.error('❌ Paradajková polievka not found!');
    console.log('💡 Creating the soup product first...');
    
    // Create the soup if it doesn't exist
    await prisma.product.create({
      data: {
        tenantId: pornopizza.id,
        name: 'Paradajková polievka',
        description: 'Krémová paradajková polievka s čerstvou bazalkou a parmezánom',
        priceCents: 449,
        image: '/images/soups/tomato-soup.jpg',
        category: 'SOUPS',
        isActive: true,
        taxRate: 20,
      },
    });
    console.log('✅ Created Paradajková polievka with image!');
  } else {
    // Update existing soup with image
    await prisma.product.update({
      where: { id: soup.id },
      data: {
        image: '/images/soups/tomato-soup.jpg',
      },
    });
    console.log('✅ Updated Paradajková polievka with image!');
  }

  console.log('\n🎉 Image added successfully!');
  console.log('📸 Image path: /images/soups/tomato-soup.jpg');
  console.log('\n💡 Make sure to add the image file to:');
  console.log('   frontend/public/images/soups/tomato-soup.jpg');
}

addSoupImage()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

