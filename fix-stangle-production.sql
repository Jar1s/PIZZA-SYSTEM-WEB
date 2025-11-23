-- Fix STANGLE products in PRODUCTION Supabase database
-- Run this in Supabase SQL Editor

-- Step 1: Move any existing štangle/posúch products from PIZZA to STANGLE category
UPDATE products 
SET category = 'STANGLE'
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    LOWER(name) LIKE '%štangle%' 
    OR LOWER(name) LIKE '%posúch%' 
    OR LOWER(name) LIKE '%stangle%' 
    OR LOWER(name) LIKE '%posuch%'
    OR name = 'Korpus' 
    OR LOWER(name) LIKE '%korpus%'
  );

-- Step 2: Delete all STANGLE products that are NOT the 4 correct ones
DELETE FROM products
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'STANGLE'
  AND name NOT IN (
    'Pizza Štangle',
    'Pizza Štangle bezlepkové',
    'Pizza Posúch',
    'Pizza Posúch bezlepkový',
    'Pizza štangle (4 ks)',
    'Bezlepkové štangle (4 ks)',
    'Pizza posúch',
    'Bezlepkový posúch'
  );

-- Step 3: Delete any products with korpus, stangle classic, deluxe, special in name (from any category)
DELETE FROM products
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND (
    LOWER(name) LIKE '%korpus%' 
    OR LOWER(name) LIKE '%štangle classic%' 
    OR LOWER(name) LIKE '%štangle deluxe%' 
    OR LOWER(name) LIKE '%štangle special%'
    OR LOWER(name) LIKE '%stangle classic%' 
    OR LOWER(name) LIKE '%stangle deluxe%' 
    OR LOWER(name) LIKE '%stangle special%'
  );

-- Step 4: Update existing STANGLE products to correct names and ensure they exist
-- Pizza štangle (4 ks)
UPDATE products 
SET name = 'Pizza štangle (4 ks)',
    description = 'Chrumkavé pizza tyčinky s bylinkami a olivovým olejom',
    "priceCents" = 349,
    category = 'STANGLE',
    image = '/images/stangle/stangle-regular.jpg',
    modifiers = '[
      {
        "id": "edge",
        "name": "Potrieť",
        "nameEn": "Brush",
        "type": "single",
        "required": false,
        "maxSelection": 1,
        "options": [
          {"id": "garlic", "name": "Cesnakom", "nameEn": "Garlic", "priceCents": 0},
          {"id": "olive-oil", "name": "Olejom", "nameEn": "Olive oil", "priceCents": 0},
          {"id": "none", "name": "Raw (nepotierať)", "nameEn": "Raw (dont brush)", "priceCents": 0}
        ]
      }
    ]'::jsonb,
    "isActive" = true
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND (
    name = 'Pizza Štangle' 
    OR name = 'Pizza štangle (4 ks)'
    OR (LOWER(name) LIKE '%štangle%' AND LOWER(name) NOT LIKE '%bezlep%')
  );

-- Bezlepkové štangle (4 ks)
UPDATE products 
SET name = 'Bezlepkové štangle (4 ks)',
    description = 'Bezlepkové chrumkavé pizza tyčinky s bylinkami',
    "priceCents" = 549,
    category = 'STANGLE',
    image = '/images/stangle/stangle-gluten-free.jpg',
    modifiers = '[
      {
        "id": "edge",
        "name": "Potrieť",
        "nameEn": "Brush",
        "type": "single",
        "required": false,
        "maxSelection": 1,
        "options": [
          {"id": "garlic", "name": "Cesnakom", "nameEn": "Garlic", "priceCents": 0},
          {"id": "olive-oil", "name": "Olejom", "nameEn": "Olive oil", "priceCents": 0},
          {"id": "none", "name": "Raw (nepotierať)", "nameEn": "Raw (dont brush)", "priceCents": 0}
        ]
      }
    ]'::jsonb,
    "isActive" = true
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND (
    name = 'Pizza Štangle bezlepkové' 
    OR name = 'Bezlepkové štangle (4 ks)'
    OR (LOWER(name) LIKE '%štangle%' AND LOWER(name) LIKE '%bezlep%')
  );

-- Pizza posúch
UPDATE products 
SET name = 'Pizza posúch',
    description = 'Tradiční posúch s cesnakom a bylinkami',
    "priceCents" = 349,
    category = 'STANGLE',
    image = '/images/pizzas/classic/korpus.jpg',
    modifiers = '[
      {
        "id": "edge",
        "name": "Potrieť",
        "nameEn": "Brush",
        "type": "single",
        "required": false,
        "maxSelection": 1,
        "options": [
          {"id": "garlic", "name": "Cesnakom", "nameEn": "Garlic", "priceCents": 0},
          {"id": "olive-oil", "name": "Olejom", "nameEn": "Olive oil", "priceCents": 0},
          {"id": "none", "name": "Raw (nepotierať)", "nameEn": "Raw (dont brush)", "priceCents": 0}
        ]
      }
    ]'::jsonb,
    "isActive" = true
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND (
    name = 'Pizza Posúch' 
    OR name = 'Pizza posúch'
    OR (LOWER(name) LIKE '%posúch%' AND LOWER(name) NOT LIKE '%bezlep%')
    OR name = 'Korpus'
    OR LOWER(name) LIKE '%korpus%'
  );

-- Bezlepkový posúch
UPDATE products 
SET name = 'Bezlepkový posúch',
    description = 'Bezlepkový posúch s cesnakom a bylinkami',
    "priceCents" = 549,
    category = 'STANGLE',
    image = '/images/pizzas/classic/korpus.jpg',
    modifiers = '[
      {
        "id": "edge",
        "name": "Potrieť",
        "nameEn": "Brush",
        "type": "single",
        "required": false,
        "maxSelection": 1,
        "options": [
          {"id": "garlic", "name": "Cesnakom", "nameEn": "Garlic", "priceCents": 0},
          {"id": "olive-oil", "name": "Olejom", "nameEn": "Olive oil", "priceCents": 0},
          {"id": "none", "name": "Raw (nepotierať)", "nameEn": "Raw (dont brush)", "priceCents": 0}
        ]
      }
    ]'::jsonb,
    "isActive" = true
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND (
    name = 'Pizza Posúch bezlepkový' 
    OR name = 'Bezlepkový posúch'
    OR (LOWER(name) LIKE '%posúch%' AND LOWER(name) LIKE '%bezlep%')
  );

-- Step 5: Create missing STANGLE products if they don't exist
INSERT INTO products (
  id,
  "tenantId",
  name,
  description,
  "priceCents",
  "taxRate",
  category,
  image,
  modifiers,
  "isActive",
  "isBestSeller",
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid()::text,
  (SELECT id FROM tenants WHERE subdomain = 'pornopizza'),
  'Pizza štangle (4 ks)',
  'Chrumkavé pizza tyčinky s bylinkami a olivovým olejom',
  349,
  20,
  'STANGLE',
  '/images/stangle/stangle-regular.jpg',
  '[
    {
      "id": "edge",
      "name": "Potrieť",
      "nameEn": "Brush",
      "type": "single",
      "required": false,
      "maxSelection": 1,
      "options": [
        {"id": "garlic", "name": "Cesnakom", "nameEn": "Garlic", "priceCents": 0},
        {"id": "olive-oil", "name": "Olejom", "nameEn": "Olive oil", "priceCents": 0},
        {"id": "none", "name": "Raw (nepotierať)", "nameEn": "Raw (dont brush)", "priceCents": 0}
      ]
    }
  ]'::jsonb,
  true,
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM products 
  WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
    AND name = 'Pizza štangle (4 ks)'
    AND category = 'STANGLE'
);

INSERT INTO products (
  id,
  "tenantId",
  name,
  description,
  "priceCents",
  "taxRate",
  category,
  image,
  modifiers,
  "isActive",
  "isBestSeller",
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid()::text,
  (SELECT id FROM tenants WHERE subdomain = 'pornopizza'),
  'Bezlepkové štangle (4 ks)',
  'Bezlepkové chrumkavé pizza tyčinky s bylinkami',
  549,
  20,
  'STANGLE',
  '/images/stangle/stangle-gluten-free.jpg',
  '[
    {
      "id": "edge",
      "name": "Potrieť",
      "nameEn": "Brush",
      "type": "single",
      "required": false,
      "maxSelection": 1,
      "options": [
        {"id": "garlic", "name": "Cesnakom", "nameEn": "Garlic", "priceCents": 0},
        {"id": "olive-oil", "name": "Olejom", "nameEn": "Olive oil", "priceCents": 0},
        {"id": "none", "name": "Raw (nepotierať)", "nameEn": "Raw (dont brush)", "priceCents": 0}
      ]
    }
  ]'::jsonb,
  true,
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM products 
  WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
    AND name = 'Bezlepkové štangle (4 ks)'
    AND category = 'STANGLE'
);

INSERT INTO products (
  id,
  "tenantId",
  name,
  description,
  "priceCents",
  "taxRate",
  category,
  image,
  modifiers,
  "isActive",
  "isBestSeller",
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid()::text,
  (SELECT id FROM tenants WHERE subdomain = 'pornopizza'),
  'Pizza posúch',
  'Tradiční posúch s cesnakom a bylinkami',
  349,
  20,
  'STANGLE',
  '/images/pizzas/classic/korpus.jpg',
  '[
    {
      "id": "edge",
      "name": "Potrieť",
      "nameEn": "Brush",
      "type": "single",
      "required": false,
      "maxSelection": 1,
      "options": [
        {"id": "garlic", "name": "Cesnakom", "nameEn": "Garlic", "priceCents": 0},
        {"id": "olive-oil", "name": "Olejom", "nameEn": "Olive oil", "priceCents": 0},
        {"id": "none", "name": "Raw (nepotierať)", "nameEn": "Raw (dont brush)", "priceCents": 0}
      ]
    }
  ]'::jsonb,
  true,
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM products 
  WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
    AND name = 'Pizza posúch'
    AND category = 'STANGLE'
);

INSERT INTO products (
  id,
  "tenantId",
  name,
  description,
  "priceCents",
  "taxRate",
  category,
  image,
  modifiers,
  "isActive",
  "isBestSeller",
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid()::text,
  (SELECT id FROM tenants WHERE subdomain = 'pornopizza'),
  'Bezlepkový posúch',
  'Bezlepkový posúch s cesnakom a bylinkami',
  549,
  20,
  'STANGLE',
  '/images/pizzas/classic/korpus.jpg',
  '[
    {
      "id": "edge",
      "name": "Potrieť",
      "nameEn": "Brush",
      "type": "single",
      "required": false,
      "maxSelection": 1,
      "options": [
        {"id": "garlic", "name": "Cesnakom", "nameEn": "Garlic", "priceCents": 0},
        {"id": "olive-oil", "name": "Olejom", "nameEn": "Olive oil", "priceCents": 0},
        {"id": "none", "name": "Raw (nepotierať)", "nameEn": "Raw (dont brush)", "priceCents": 0}
      ]
    }
  ]'::jsonb,
  true,
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM products 
  WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
    AND name = 'Bezlepkový posúch'
    AND category = 'STANGLE'
);

-- Step 6: Ensure only these 4 products are active in STANGLE category
UPDATE products 
SET "isActive" = true
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'STANGLE'
  AND name IN ('Pizza štangle (4 ks)', 'Bezlepkové štangle (4 ks)', 'Pizza posúch', 'Bezlepkový posúch');

UPDATE products 
SET "isActive" = false
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'STANGLE'
  AND name NOT IN ('Pizza štangle (4 ks)', 'Bezlepkové štangle (4 ks)', 'Pizza posúch', 'Bezlepkový posúch');

-- Step 7: Verify STANGLE products (should be exactly 4 active products)
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

