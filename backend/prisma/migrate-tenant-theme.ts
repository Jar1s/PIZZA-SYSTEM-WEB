/**
 * Migration script to update existing tenants with new layout configuration
 * Run with: npx ts-node backend/prisma/migrate-tenant-theme.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting tenant theme migration...\n');

  // Update Pornopizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { slug: 'pornopizza' },
  });

  if (pornopizza) {
    const currentTheme = pornopizza.theme as any;
    const updatedTheme = {
      ...currentTheme,
      layout: {
        headerStyle: 'dark',
        backgroundStyle: 'black',
        useCustomLogo: true,
        customLogoComponent: 'PornoPizzaLogo',
        useCustomBackground: true,
        customBackgroundClass: 'porno-bg',
      },
    };

    await prisma.tenant.update({
      where: { slug: 'pornopizza' },
      data: {
        theme: updatedTheme,
      },
    });

    console.log('✅ Updated Pornopizza tenant with dark theme layout');
  } else {
    console.log('⚠️  Pornopizza tenant not found');
  }

  // Update Pizza v Núdzi tenant
  const pizzavnudzi = await prisma.tenant.findUnique({
    where: { slug: 'pizzavnudzi' },
  });

  if (pizzavnudzi) {
    const currentTheme = pizzavnudzi.theme as any;
    const updatedTheme = {
      ...currentTheme,
      layout: {
        headerStyle: 'light',
        backgroundStyle: 'white',
        useCustomLogo: false,
      },
    };

    await prisma.tenant.update({
      where: { slug: 'pizzavnudzi' },
      data: {
        theme: updatedTheme,
      },
    });

    console.log('✅ Updated Pizza v Núdzi tenant with light theme layout');
  } else {
    console.log('⚠️  Pizza v Núdzi tenant not found');
  }

  // Update any other tenants with default light theme
  const allTenants = await prisma.tenant.findMany({
    where: {
      slug: {
        notIn: ['pornopizza', 'pizzavnudzi'],
      },
    },
  });

  for (const tenant of allTenants) {
    const currentTheme = tenant.theme as any;
    
    // Only update if layout doesn't exist
    if (!currentTheme.layout) {
      const updatedTheme = {
        ...currentTheme,
        layout: {
          headerStyle: 'light',
          backgroundStyle: 'white',
          useCustomLogo: false,
        },
      };

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          theme: updatedTheme,
        },
      });

      console.log(`✅ Updated ${tenant.name} (${tenant.slug}) with default light theme layout`);
    }
  }

  console.log('\n✅ Migration completed!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

