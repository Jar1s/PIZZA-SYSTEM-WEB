-- Storyous mapping import using POS ID (full set from menu (3).xlsx)
-- tenant slug: pornopizza
-- mapped rows: 36
-- missing in xlsx: 2
-- Basil Pesto (old inner: 657b091f4562a4a1b58e5aff)
-- Honey Chilli (old inner: 657b09844562a4a1b58e5b07)

BEGIN;

WITH target_tenant AS (
  SELECT id FROM "tenants" WHERE "slug" = 'pornopizza' LIMIT 1
),
input_values("externalIdentifier", "internalProductName") AS (
  VALUES
    ('p:gbjUwZmMz', 'Bon Salami'),
    ('p:ibWFpcmlm', 'Calimero'),
    ('p:lbDQxZnJp', 'Capri'),
    ('p:lbDQxaTAw', 'Coca Cola 1l'),
    ('p:ma2xwbzFs', 'Cola Zero 1l'),
    ('p:ma2xwbTBm', 'Da Vinci'),
    ('p:vaDIzZ25p', 'Diavola'),
    ('p:kbGc3YnM3', 'Fanta 1l'),
    ('p:uaGU5YWw5', 'Fregata'),
    ('p:xZzdsc3Mw', 'Gazdovská'),
    ('p:kbGc3OW9q', 'Hawaii'),
    ('p:gbjUwaGtm', 'Kofola 2l'),
    ('p:ebnRjMzVk', 'Margherita'),
    ('p:oanJlNDYz', 'Mayday'),
    ('p:2c3BsbWYx', 'Paradajková polievka'),
    ('p:hbW1vbm1n', 'Pepsi 1l'),
    ('p:ibWFpdG9m', 'Pepsi Zero 1l'),
    ('p:hbW1vbGZh', 'Picante'),
    ('p:wZ2pybXBw', 'Pivárska'),
    ('p:5cmo0YW5t', 'Pizza Posúch'),
    ('p:6cjZzZ3Fm', 'Pizza Posúch bezlepkový'),
    ('p:3c2Rmc2kw', 'Pizza Štangle'),
    ('p:4czFhNGty', 'Pizza Štangle bezlepkové'),
    ('p:0dGszYThy', 'Pollo Crema'),
    ('p:fbmg2OThv', 'Prosciutto'),
    ('p:1dDdyZ2Mw', 'Prosciutto Crudo'),
    ('p:jbHNkM2xp', 'Prosciutto Funghi'),
    ('p:pamY4YThv', 'Provinciale'),
    ('p:qajMyZ2Jk', 'Quattro Formaggi'),
    ('p:raWtxbWUw', 'Quattro Formaggi Bianco'),
    ('p:nazlqczNh', 'Quattro Stagioni'),
    ('p:jbHNkNXFj', 'Sprite 1l'),
    ('p:db2JodGUw', 'Tiramisu'),
    ('p:saThrc2dm', 'Tuniaková'),
    ('p:taHFmNGlz', 'Vegetariana'),
    ('p:db2JocjIw', 'Vyskladaj si vlastnú pizzu')
)
DELETE FROM "product_mappings" pm
USING target_tenant t, input_values iv
WHERE pm."tenantId" = t.id
  AND pm."source" = 'storyous'
  AND pm."internalProductName" = iv."internalProductName"
  AND pm."externalIdentifier" <> iv."externalIdentifier";

WITH target_tenant AS (
  SELECT id FROM "tenants" WHERE "slug" = 'pornopizza' LIMIT 1
),
input_values("externalIdentifier", "internalProductName") AS (
  VALUES
    ('p:gbjUwZmMz', 'Bon Salami'),
    ('p:ibWFpcmlm', 'Calimero'),
    ('p:lbDQxZnJp', 'Capri'),
    ('p:lbDQxaTAw', 'Coca Cola 1l'),
    ('p:ma2xwbzFs', 'Cola Zero 1l'),
    ('p:ma2xwbTBm', 'Da Vinci'),
    ('p:vaDIzZ25p', 'Diavola'),
    ('p:kbGc3YnM3', 'Fanta 1l'),
    ('p:uaGU5YWw5', 'Fregata'),
    ('p:xZzdsc3Mw', 'Gazdovská'),
    ('p:kbGc3OW9q', 'Hawaii'),
    ('p:gbjUwaGtm', 'Kofola 2l'),
    ('p:ebnRjMzVk', 'Margherita'),
    ('p:oanJlNDYz', 'Mayday'),
    ('p:2c3BsbWYx', 'Paradajková polievka'),
    ('p:hbW1vbm1n', 'Pepsi 1l'),
    ('p:ibWFpdG9m', 'Pepsi Zero 1l'),
    ('p:hbW1vbGZh', 'Picante'),
    ('p:wZ2pybXBw', 'Pivárska'),
    ('p:5cmo0YW5t', 'Pizza Posúch'),
    ('p:6cjZzZ3Fm', 'Pizza Posúch bezlepkový'),
    ('p:3c2Rmc2kw', 'Pizza Štangle'),
    ('p:4czFhNGty', 'Pizza Štangle bezlepkové'),
    ('p:0dGszYThy', 'Pollo Crema'),
    ('p:fbmg2OThv', 'Prosciutto'),
    ('p:1dDdyZ2Mw', 'Prosciutto Crudo'),
    ('p:jbHNkM2xp', 'Prosciutto Funghi'),
    ('p:pamY4YThv', 'Provinciale'),
    ('p:qajMyZ2Jk', 'Quattro Formaggi'),
    ('p:raWtxbWUw', 'Quattro Formaggi Bianco'),
    ('p:nazlqczNh', 'Quattro Stagioni'),
    ('p:jbHNkNXFj', 'Sprite 1l'),
    ('p:db2JodGUw', 'Tiramisu'),
    ('p:saThrc2dm', 'Tuniaková'),
    ('p:taHFmNGlz', 'Vegetariana'),
    ('p:db2JocjIw', 'Vyskladaj si vlastnú pizzu')
),
validated AS (
  SELECT iv."externalIdentifier", iv."internalProductName", t.id AS "tenantId"
  FROM input_values iv
  CROSS JOIN target_tenant t
  INNER JOIN "products" p
    ON p."tenantId" = t.id
   AND p."name" = iv."internalProductName"
   AND p."isActive" = true
)
INSERT INTO "product_mappings" (
  "id", "tenantId", "externalIdentifier", "internalProductName", "source", "createdAt", "updatedAt"
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

SELECT t.slug, pm."internalProductName", pm."externalIdentifier", pm."updatedAt"
FROM "product_mappings" pm
JOIN "tenants" t ON t.id = pm."tenantId"
WHERE t.slug = 'pornopizza'
  AND pm."source" = 'storyous'
  AND pm."internalProductName" IN (
    'Bon Salami',
    'Calimero',
    'Capri',
    'Coca Cola 1l',
    'Cola Zero 1l',
    'Da Vinci',
    'Diavola',
    'Fanta 1l',
    'Fregata',
    'Gazdovská',
    'Hawaii',
    'Kofola 2l',
    'Margherita',
    'Mayday',
    'Paradajková polievka',
    'Pepsi 1l',
    'Pepsi Zero 1l',
    'Picante',
    'Pivárska',
    'Pizza Posúch',
    'Pizza Posúch bezlepkový',
    'Pizza Štangle',
    'Pizza Štangle bezlepkové',
    'Pollo Crema',
    'Prosciutto',
    'Prosciutto Crudo',
    'Prosciutto Funghi',
    'Provinciale',
    'Quattro Formaggi',
    'Quattro Formaggi Bianco',
    'Quattro Stagioni',
    'Sprite 1l',
    'Tiramisu',
    'Tuniaková',
    'Vegetariana',
    'Vyskladaj si vlastnú pizzu'
  )
ORDER BY pm."internalProductName";

COMMIT;
