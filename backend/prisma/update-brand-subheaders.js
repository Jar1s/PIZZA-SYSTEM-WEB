// One-off job: write brand-specific pizza subheaders (and pizzavnudzi display
// names) into the DB. Every brand except pornopizza had inherited PornoPizza's
// subheaders verbatim; this replaces them with brand-themed SK/EN copy.
//
// Payload lives in brand-subheaders.json next to this file: an array of
//   { id, brand, slug, subHeader: '{"sk":"...","en":"..."}', displayName? }
//
// Run with DRY_RUN=1 first — it reports what would change and writes nothing.
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient();
const DRY = process.env.DRY_RUN === '1';

(async () => {
  const items = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'brand-subheaders.json'), 'utf8')
  );
  console.log(`${items.length} updates queued${DRY ? ' (DRY RUN — no writes)' : ''}`);

  let changed = 0;
  let renamed = 0;
  let skipped = 0;
  const missing = [];

  for (const it of items) {
    const current = await p.product.findUnique({ where: { id: it.id } });
    if (!current) {
      missing.push(`${it.brand}/${it.slug} (${it.id})`);
      continue;
    }

    const data = {};
    if (current.subHeader !== it.subHeader) data.subHeader = it.subHeader;
    if (it.displayName && current.displayName !== it.displayName) {
      data.displayName = it.displayName;
    }

    if (Object.keys(data).length === 0) {
      skipped += 1;
      continue;
    }

    if (data.displayName) {
      renamed += 1;
      console.log(
        `  ${it.brand}/${it.slug}: "${current.displayName}" -> "${data.displayName}"`
      );
    }

    if (!DRY) await p.product.update({ where: { id: it.id }, data });
    changed += 1;
  }

  console.log(
    `\n${DRY ? 'would change' : 'changed'}: ${changed}  renamed: ${renamed}  already correct: ${skipped}  missing: ${missing.length}`
  );
  if (missing.length) {
    console.log('MISSING PRODUCT IDS:');
    for (const m of missing) console.log(`  ${m}`);
  }

  await p.$disconnect();

  // A missing product id means the payload is stale against the DB — fail loudly
  // instead of reporting a partial run as success.
  if (missing.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
