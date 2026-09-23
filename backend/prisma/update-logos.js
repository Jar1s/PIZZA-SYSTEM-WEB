const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const updates = {
  'pizzavnudzi-sk': '/logos/pizzavnudzi.svg',
  pizzalover:       '/logos/pizzalover.png',
  pizzaprefirmy:    '/logos/pizzaprefirmy.png',
  skinnyb1tchpizza: '/logos/skinnyb1tchpizza.png',
  ozemp1cpizza:     '/logos/ozemp1cpizza.png',
  pizzacorner:      '/logos/pizzacorner.png',
};
(async () => {
  for (const [slug, logo] of Object.entries(updates)) {
    const t = await p.tenant.findUnique({ where: { slug } });
    if (!t) { console.log(slug + ': NOT FOUND'); continue; }
    const theme = t.theme || {};
    await p.tenant.update({ where: { slug }, data: { theme: { ...theme, logo } } });
    console.log(slug + ': OK -> ' + logo);
  }
  await p.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
