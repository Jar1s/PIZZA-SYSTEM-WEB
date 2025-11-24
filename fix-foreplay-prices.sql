-- Fix PREDOHRA / FOREPLAY product prices in PRODUCTION Supabase database
-- Run this in Supabase SQL Editor

-- Expected prices:
-- Margherita Nuda (Margherita) - 7.99 €
-- Prosciutto Tease (Prosciutto) - 9.99 €
-- Salami 69 (Bon Salami) - 9.99 €
-- Hot Fantasy (Picante) - 10.99 €
-- Calimero Quickie (Calimero) - 10.99 €
-- Shroom Affair (Prosciutto Funghi) - 10.99 €
-- Hawai Crush (Hawaii Premium) - 10.99 €
-- Corny Love (Capri) - 10.99 €
-- Da Vinci Desire (Da Vinci) - 10.99 €
-- Mixtape of Sins (Quattro Stagioni) - 10.99 €

-- Update Margherita Nuda (Margherita) - 7.99 € (799 cents)
UPDATE products 
SET "priceCents" = 799,
    description = 'Paradajkový základ, mozzarella – základ každého potešenia.'
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Margherita'
  AND "priceCents" != 799;

-- Update Prosciutto Tease (Prosciutto) - 9.99 € (999 cents)
UPDATE products 
SET "priceCents" = 999,
    description = 'Paradajkový základ, mozzarella, šunka – jemne vyzývavá.'
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Prosciutto'
  AND "priceCents" != 999;

-- Update Salami 69 (Bon Salami) - 9.99 € (999 cents)
UPDATE products 
SET "priceCents" = 999,
    description = 'Paradajkový základ, mozzarella, saláma – spicy in all the right places.'
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Bon Salami'
  AND "priceCents" != 999;

-- Update Hot Fantasy (Picante) - 10.99 € (1099 cents)
UPDATE products 
SET "priceCents" = 1099,
    description = 'Paradajkový základ, mozzarella, feferóny, pikantná saláma – horúce spojenie.'
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Picante'
  AND "priceCents" != 1099;

-- Update Calimero Quickie (Calimero) - 10.99 € (1099 cents)
UPDATE products 
SET "priceCents" = 1099,
    description = 'Paradajkový základ, mozzarella, šunka, vajce – rýchle, ale stojí za to.'
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Calimero'
  AND "priceCents" != 1099;

-- Update Shroom Affair (Prosciutto Funghi) - 10.99 € (1099 cents)
UPDATE products 
SET "priceCents" = 1099,
    description = 'Paradajkový základ, mozzarella, šunka, šampiňóny – jemne zakázaná kombinácia, čo prekvapí každým sústom.'
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Prosciutto Funghi'
  AND "priceCents" != 1099;

-- Update Hawai Crush (Hawaii Premium) - 10.99 € (1099 cents)
UPDATE products 
SET "priceCents" = 1099,
    description = 'Paradajkový základ, mozzarella, šunka, ananás – tropický flirt.'
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Hawaii Premium'
  AND "priceCents" != 1099;

-- Update Corny Love (Capri) - 10.99 € (1099 cents)
UPDATE products 
SET "priceCents" = 1099,
    description = 'Paradajkový základ, mozzarella, šunka, kukurica – sladká nevinnosť.'
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Capri'
  AND "priceCents" != 1099;

-- Update Da Vinci Desire (Da Vinci) - 10.99 € (1099 cents)
UPDATE products 
SET "priceCents" = 1099,
    description = 'Paradajkový základ, mozzarella, šunka, šampiňóny, kukurica.'
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Da Vinci'
  AND "priceCents" != 1099;

-- Update Mixtape of Sins (Quattro Stagioni) - 10.99 € (1099 cents)
UPDATE products 
SET "priceCents" = 1099,
    description = 'Paradajkový základ, mozzarella, šunka, šampiňóny, olivy, artičoky – všetko, čo by si nemal… ale chceš.'
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name = 'Quattro Stagioni'
  AND "priceCents" != 1099;

-- Verify PREDOHRA products prices
SELECT 
  name, 
  "priceCents", 
  ("priceCents"::float / 100)::numeric(10,2) as price_eur,
  description
FROM products 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND name IN ('Margherita', 'Prosciutto', 'Bon Salami', 'Picante', 'Calimero', 'Prosciutto Funghi', 'Hawaii Premium', 'Capri', 'Da Vinci', 'Quattro Stagioni')
ORDER BY 
  CASE name
    WHEN 'Margherita' THEN 1
    WHEN 'Prosciutto' THEN 2
    WHEN 'Bon Salami' THEN 3
    WHEN 'Picante' THEN 4
    WHEN 'Calimero' THEN 5
    WHEN 'Prosciutto Funghi' THEN 6
    WHEN 'Hawaii Premium' THEN 7
    WHEN 'Capri' THEN 8
    WHEN 'Da Vinci' THEN 9
    WHEN 'Quattro Stagioni' THEN 10
  END;

