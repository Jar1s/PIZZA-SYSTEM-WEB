-- Ensure Paradajková polievka exists and is active in PRODUCTION Supabase database
-- Run this in Supabase SQL Editor

-- Step 1: Update existing soup product if it exists
UPDATE products 
SET name = 'Paradajková polievka',
    description = '🥫 Zachráni aj po najdivokejšej noci.',
    "priceCents" = 449,
    "taxRate" = 20,
    category = 'SOUPS',
    "isActive" = true
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND (name = 'Paradajková polievka' OR name LIKE '%polievka%' OR name LIKE '%soup%')
  AND category = 'SOUPS';

-- Step 2: Create soup product if it doesn't exist
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
  'Paradajková polievka',
  '🥫 Zachráni aj po najdivokejšej noci.',
  449,
  20,
  'SOUPS',
  NULL,
  NULL,
  true,
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM products 
  WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
    AND name = 'Paradajková polievka'
    AND category = 'SOUPS'
);

-- Step 3: Ensure soup product is active
UPDATE products 
SET "isActive" = true
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Paradajková polievka'
  AND category = 'SOUPS';

-- Step 4: Verify SOUPS products
SELECT 
  name, 
  "priceCents", 
  ("priceCents"::float / 100)::numeric(10,2) as price_eur,
  category,
  "isActive",
  description
FROM products 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'SOUPS'
ORDER BY name;

