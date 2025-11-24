-- Update Paradajková polievka description for MORNING AFTER section
-- Run this in Supabase SQL Editor

UPDATE products 
SET description = '🥫 Zachráni aj po najdivokejšej noci.'
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Paradajková polievka'
  AND category = 'SOUPS';

-- Verify the update
SELECT 
  name, 
  "priceCents", 
  ("priceCents"::float / 100)::numeric(10,2) as price_eur,
  description,
  category
FROM products 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'SOUPS'
ORDER BY name;

