-- Storyous mapping import using POS ID (recommended for Storyous itemId)
-- tenant slug: pornopizza
-- source file: menu (3).xlsx (sheet Menu, POS ID column)
-- rows: 11 (core pizza items)

BEGIN;

-- 1) Remove outdated storyous mappings for these products (keeps table clean)
WITH target_tenant AS (
  SELECT id
  FROM "tenants"
  WHERE "slug" = 'pornopizza'
  LIMIT 1
),
input_values("externalIdentifier", "internalProductName") AS (
  VALUES
    ('p:gbjUwZmMz', 'Bon Salami'),
    ('p:ibWFpcmlm', 'Calimero'),
    ('p:lbDQxZnJp', 'Capri'),
    ('p:ma2xwbTBm', 'Da Vinci'),
    ('p:kbGc3OW9q', 'Hawaii'), -- xlsx row is "Pizza Hawai", DB product is "Hawaii"
    ('p:ebnRjMzVk', 'Margherita'),
    ('p:hbW1vbGZh', 'Picante'),
    ('p:fbmg2OThv', 'Prosciutto'),
    ('p:jbHNkM2xp', 'Prosciutto Funghi'),
    ('p:nazlqczNh', 'Quattro Stagioni'),
    ('p:db2JocjIw', 'Vyskladaj si vlastnú pizzu')
)
DELETE FROM "product_mappings" pm
USING target_tenant t, input_values iv
WHERE pm."tenantId" = t.id
  AND pm."source" = 'storyous'
  AND pm."internalProductName" = iv."internalProductName"
  AND pm."externalIdentifier" <> iv."externalIdentifier";

-- 2) Upsert POS-ID based mapping
WITH target_tenant AS (
  SELECT id
  FROM "tenants"
  WHERE "slug" = 'pornopizza'
  LIMIT 1
),
input_values("externalIdentifier", "internalProductName") AS (
  VALUES
    ('p:gbjUwZmMz', 'Bon Salami'),
    ('p:ibWFpcmlm', 'Calimero'),
    ('p:lbDQxZnJp', 'Capri'),
    ('p:ma2xwbTBm', 'Da Vinci'),
    ('p:kbGc3OW9q', 'Hawaii'),
    ('p:ebnRjMzVk', 'Margherita'),
    ('p:hbW1vbGZh', 'Picante'),
    ('p:fbmg2OThv', 'Prosciutto'),
    ('p:jbHNkM2xp', 'Prosciutto Funghi'),
    ('p:nazlqczNh', 'Quattro Stagioni'),
    ('p:db2JocjIw', 'Vyskladaj si vlastnú pizzu')
),
validated AS (
  SELECT
    iv."externalIdentifier",
    iv."internalProductName",
    t.id AS "tenantId"
  FROM input_values iv
  CROSS JOIN target_tenant t
  INNER JOIN "products" p
    ON p."tenantId" = t.id
   AND p."name" = iv."internalProductName"
   AND p."isActive" = true
)
INSERT INTO "product_mappings" (
  "id",
  "tenantId",
  "externalIdentifier",
  "internalProductName",
  "source",
  "createdAt",
  "updatedAt"
)
SELECT
  'pm_' || substr(md5(random()::text || clock_timestamp()::text || v."externalIdentifier"), 1, 24),
  v."tenantId",
  v."externalIdentifier",
  v."internalProductName",
  'storyous',
  NOW(),
  NOW()
FROM validated v
ON CONFLICT ("tenantId", "externalIdentifier", "source")
DO UPDATE SET
  "internalProductName" = EXCLUDED."internalProductName",
  "updatedAt" = NOW();

-- 3) Verification for this tenant
SELECT
  t.slug,
  pm."internalProductName",
  pm."externalIdentifier",
  pm."updatedAt"
FROM "product_mappings" pm
JOIN "tenants" t ON t.id = pm."tenantId"
WHERE t.slug = 'pornopizza'
  AND pm."source" = 'storyous'
  AND pm."internalProductName" IN (
    'Bon Salami',
    'Calimero',
    'Capri',
    'Da Vinci',
    'Hawaii',
    'Margherita',
    'Picante',
    'Prosciutto',
    'Prosciutto Funghi',
    'Quattro Stagioni',
    'Vyskladaj si vlastnú pizzu'
  )
ORDER BY pm."internalProductName";

COMMIT;

