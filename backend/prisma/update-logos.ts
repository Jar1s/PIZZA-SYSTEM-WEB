/**
 * Update theme.logo for all brands to new logo paths.
 * Run:  npx ts-node prisma/update-logos.ts          (dry run)
 *       npx ts-node prisma/update-logos.ts --apply  (write to DB)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

const LOGO_UPDATES: Record<string, string> = {
  pizzavnudzi:      '/logos/pizzavnudzi.svg',
  pizzalover:       '/logos/pizzalover.png',
  pizzaprefirmy:    '/logos/pizzaprefirmy.png',
  skinnyb1tchpizza: '/logos/skinnyb1tchpizza.png',
  ozemp1cpizza:     '/logos/ozemp1cpizza.png',
  pizzacorner:      '/logos/pizzacorner.png',
};

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: { slug: { in: Object.keys(LOGO_UPDATES) } },
    select: { id: true, slug: true, theme: true },
  });

  for (const tenant of tenants) {
    const newLogo = LOGO_UPDATES[tenant.slug];
    const theme = (tenant.theme as any) || {};
    const currentLogo = theme.logo;
    console.log(`${tenant.slug}: ${currentLogo} → ${newLogo}`);

    if (apply) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { theme: { ...theme, logo: newLogo } },
      });
      console.log(`  ✅ updated`);
    }
  }

  if (!apply) console.log('\nDRY RUN — spusti s --apply na zápis');
}

main().catch(console.error).finally(() => prisma.$disconnect());
