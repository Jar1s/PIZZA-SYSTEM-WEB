-- Fix product prices for PornoPizza tenant
-- Run this in Supabase SQL Editor

-- Update Premium Sins products
UPDATE products 
SET "priceCents" = 1199 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Basil Pesto Premium';

UPDATE products 
SET "priceCents" = 1099 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Honey Chilli';

UPDATE products 
SET "priceCents" = 1099 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Pollo Crema';

UPDATE products 
SET "priceCents" = 1199 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Prosciutto Crudo Premium';

-- Update DELUXE FETISH products
UPDATE products 
SET "priceCents" = 1099 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Quattro Formaggi';

UPDATE products 
SET "priceCents" = 1099 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Quattro Formaggi Bianco';

UPDATE products 
SET "priceCents" = 1099 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Tonno';

UPDATE products 
SET "priceCents" = 1099 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Vegetariana Premium';

UPDATE products 
SET "priceCents" = 1099 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Hot Missionary';

-- Update MAIN ACTION products (all should be 10.99 €)
UPDATE products 
SET "priceCents" = 1099 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Mayday Special'; -- Bacon Affair

UPDATE products 
SET "priceCents" = 1099 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Gazdovská'; -- Gazda Deluxe

UPDATE products 
SET "priceCents" = 1099 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Pivárska'; -- Hotline Pizza (Pizza Beer Lovers)

UPDATE products 
SET "priceCents" = 1099 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Diavola Premium'; -- Diavola Dominant

UPDATE products 
SET "priceCents" = 1099 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Provinciale'; -- Country Affair

-- Move Štangle, Posúch and Korpus products to STANGLE category (if they're in PIZZA)
UPDATE products 
SET category = 'STANGLE'
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (name LIKE '%štangle%' OR name LIKE '%posúch%' OR name LIKE '%Štangle%' OR name LIKE '%Posúch%' OR name = 'Korpus' OR name LIKE '%Korpus%' OR name = 'Pizza Korpus');

-- Delete all STANGLE products that are not the 4 correct ones
DELETE FROM products
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'STANGLE'
  AND name NOT IN ('Pizza Štangle', 'Pizza Štangle bezlepkové', 'Pizza Posúch', 'Pizza Posúch bezlepkový');

-- Delete any products with korpus, stangle classic, deluxe, special in name (from any category)
DELETE FROM products
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND (name LIKE '%Korpus%' OR name LIKE '%korpus%' 
       OR name LIKE '%Štangle Classic%' OR name LIKE '%Štangle Deluxe%' OR name LIKE '%Štangle Special%'
       OR name LIKE '%Stangle Classic%' OR name LIKE '%Stangle Deluxe%' OR name LIKE '%Stangle Special%');

-- Update STANGLE products: names and descriptions
UPDATE products 
SET name = 'Pizza štangle (4 ks)',
    description = 'Chrumkavé pizza tyčinky s bylinkami a olivovým olejom'
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Pizza Štangle';

UPDATE products 
SET name = 'Bezlepkové štangle (4 ks)',
    description = 'Bezlepkové chrumkavé pizza tyčinky s bylinkami'
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Pizza Štangle bezlepkové';

UPDATE products 
SET name = 'Pizza posúch',
    description = 'Tradiční posúch s cesnakom a bylinkami'
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Pizza Posúch';

UPDATE products 
SET name = 'Bezlepkový posúch',
    description = 'Bezlepkový posúch s cesnakom a bylinkami'
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Pizza Posúch bezlepkový';

-- Ensure only these 4 products are active in STANGLE category
UPDATE products 
SET "isActive" = true
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'STANGLE'
  AND name IN ('Pizza štangle (4 ks)', 'Bezlepkové štangle (4 ks)', 'Pizza posúch', 'Bezlepkový posúch');

-- Verify STANGLE products (should be exactly 4 active products)
SELECT 
  name, 
  "priceCents", 
  ("priceCents"::float / 100)::numeric(10,2) as price_eur,
  category,
  "isActive"
FROM products 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'STANGLE'
ORDER BY name;

-- Verify all updated products
SELECT 
  name, 
  "priceCents", 
  ("priceCents"::float / 100)::numeric(10,2) as price_eur,
  category
FROM products 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name IN (
    'Basil Pesto Premium',
    'Honey Chilli',
    'Pollo Crema',
    'Prosciutto Crudo Premium',
    'Quattro Formaggi',
    'Quattro Formaggi Bianco',
    'Tonno',
    'Vegetariana Premium',
    'Hot Missionary',
    'Mayday Special',
    'Gazdovská',
    'Pivárska',
    'Diavola Premium',
    'Provinciale',
    'Pizza štangle (4 ks)',
    'Bezlepkové štangle (4 ks)',
    'Pizza posúch',
    'Bezlepkový posúch'
  )
ORDER BY category, name;

