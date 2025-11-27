-- ============================================
-- VERIFIKOVANÝ SQL SKRIPT: Pridanie gramáže a alergénov
-- ============================================
-- Skontrolované podľa obrázka s menu
-- Spustite v Supabase SQL Editori

-- ============================================
-- KROK 1: PRIDANIE STĹPCOV (ak ešte nie sú)
-- ============================================
ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "weightGrams" INTEGER,
ADD COLUMN IF NOT EXISTS "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- ============================================
-- KROK 2: UPDATE PODĽA OBRÁZKA
-- ============================================
-- Všetky hodnoty skontrolované podľa obrázka
-- Skript používa flexibilné WHERE klauzuly (názov aj description)

-- 1. Vyskladaj si vlastnú pizzu - 7.99€, (prázdne gramáž a alergény)
UPDATE products 
SET "weightGrams" = NULL,
    allergens = ARRAY[]::TEXT[]
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (name LIKE '%vlastnú%' OR name LIKE '%Build Your Own%' OR name = 'Vyskladaj si vlastnú pizzu');

-- 2. Pizza Margherita - 7.99€, 450g, (1,7)
UPDATE products 
SET "weightGrams" = 450,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Margherita' 
    OR name = 'Pizza Margherita'
    OR (description LIKE '%Paradajkový základ, mozzarella%')
  );

-- 3. Pizza Prosciutto - 9.99€, 500g, (1,7)
UPDATE products 
SET "weightGrams" = 500,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Prosciutto'
    OR name = 'Pizza Prosciutto'
    OR (description LIKE '%Paradajkový základ, mozzarella, šunka%')
  );

-- 4. Pizza Bon Salami - 9.99€, 500g, (1,7)
UPDATE products 
SET "weightGrams" = 500,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Bon Salami'
    OR name = 'Pizza Bon Salami'
    OR (description LIKE '%Paradajkový základ, mozzarella, saláma%')
  );

-- 5. Pizza Picante - 10.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Picante'
    OR name = 'Pizza Picante'
    OR (description LIKE '%feferóny%' AND description LIKE '%pikantná saláma%')
  );

-- 6. Pizza Calimero - 10.99€, 520g, (1,3,7) ⚠️ POZOR: obsahuje vajce (3)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '3', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Calimero'
    OR name = 'Pizza Calimero'
    OR (description LIKE '%šunka, kukurica%' AND name LIKE '%Calimero%')
  );

-- 7. Pizza Prosciutto Funghi - 10.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Prosciutto Funghi'
    OR name = 'Pizza Prosciutto Funghi'
    OR (description LIKE '%šunka, šampiňóny%' AND name LIKE '%Prosciutto%' AND name LIKE '%Funghi%')
  );

-- 8. Pizza Hawai - 10.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Hawaii Premium'
    OR name = 'Hawaii'
    OR name = 'Pizza Hawai'
    OR (description LIKE '%šunka, ananás%' OR description LIKE '%ham, pineapple%')
  );

-- 9. Pizza Capri - 10.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Capri'
    OR name = 'Pizza Capri'
    OR (description LIKE '%šunka, kukurica%' AND name LIKE '%Capri%')
  );

-- 10. Pizza Da Vinci - 10.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Da Vinci'
    OR name = 'Pizza Da Vinci'
    OR (description LIKE '%slanina, niva, olivy%' OR description LIKE '%bacon, niva, olives%')
  );

-- 11. Pizza Quattro Stagioni - 10.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Quattro Stagioni'
    OR name = 'Pizza Quattro Stagioni'
    OR (description LIKE '%artičoky%' OR description LIKE '%artichokes%')
  );

-- 12. Pizza Mayday - 10.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Mayday Special'
    OR name = 'Mayday'
    OR name = 'Pizza Mayday'
    OR (description LIKE '%slanina, kukurica, vajce%' OR description LIKE '%bacon, corn, egg%')
  );

-- 13. Pizza Provinciale - 10.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Provinciale'
    OR name = 'Pizza Provinciale'
    OR (description LIKE '%baranie rohy%' OR description LIKE '%ram%')
  );

-- 14. Pizza Quattro Formaggi - 10.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Quattro Formaggi'
    OR name = 'Pizza Quattro Formaggi'
    OR (description LIKE '%niva, eidam, parmezán%' AND description NOT LIKE '%Smotanový%')
  );

-- 15. Pizza Quattro Formaggi Bianco - 10.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Quattro Formaggi Bianco'
    OR name = 'Pizza Quattro Formaggi Bianco'
    OR (description LIKE '%Smotanový základ%' AND description LIKE '%niva, eidam, parmezán%')
  );

-- 16. Pizza Tuniaková - 10.99€, 520g, (1,4,7) ⚠️ POZOR: obsahuje ryby (4)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '4', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Tonno'
    OR name = 'Tuniaková'
    OR name = 'Pizza Tuniaková'
    OR (description LIKE '%tuniak%' OR description LIKE '%tuna%')
  );

-- 17. Pizza Vegetariana - 10.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Vegetariana Premium'
    OR name = 'Vegetariana'
    OR name = 'Pizza Vegetariana'
    OR (description LIKE '%brokolica%' OR description LIKE '%broccoli%' OR description LIKE '%baby špenát%')
  );

-- 18. Pizza Fregata - 10.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Fregata'
    OR name = 'Pizza Fregata'
    OR (description LIKE '%niva, šampiňóny, cibuľa, olivy, vajce%')
  );

-- 19. Pizza Diavola - 10.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Diavola Premium'
    OR name = 'Diavola'
    OR name = 'Pizza Diavola'
    OR (description LIKE '%chilli%' AND description LIKE '%baranie rohy%')
  );

-- 20. Pizza Pivárska - 10.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Pivárska'
    OR name = 'Pizza Pivárska'
    OR (description LIKE '%klobása%' AND description LIKE '%niva%')
  );

-- 21. Pizza Gazdovská - 10.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Gazdovská'
    OR name = 'Pizza Gazdovská'
    OR (description LIKE '%slanina, cibuľa, šampiňóny, saláma%')
  );

-- 22. Pizza Bazila Pesto - 11.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Basil Pesto Premium'
    OR name = 'Pizza Bazila Pesto'
    OR (description LIKE '%Bazalkové pesto%' OR description LIKE '%basil pesto%')
  );

-- 23. Pizza Med-Chilli - 10.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Honey Chilli'
    OR name = 'Pizza Med-Chilli'
    OR (description LIKE '%med%' AND description LIKE '%chilli%' AND description LIKE '%kuracie%')
  );

-- 24. Pizza Pollo Crema - 10.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Pollo Crema'
    OR name = 'Pizza Pollo Crema'
    OR (description LIKE '%Smotanový základ%' AND description LIKE '%kuracie%' AND description LIKE '%brokolica%')
  );

-- 25. Pizza Prosciutto Crudo - 11.99€, 520g, (1,7)
UPDATE products 
SET "weightGrams" = 520,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Prosciutto Crudo Premium'
    OR name = 'Pizza Prosciutto Crudo'
    OR (description LIKE '%prosciutto crudo%' AND description LIKE '%rukola%')
  );

-- ============================================
-- KROK 3: VERIFIKÁCIA
-- ============================================
-- Skontrolujte, či sa všetky dáta správne aktualizovali
SELECT 
  name,
  "weightGrams",
  allergens,
  ("priceCents"::float / 100)::numeric(10,2) as price_eur,
  description
FROM products 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
ORDER BY 
  CASE 
    WHEN "weightGrams" IS NULL THEN 999
    ELSE "weightGrams"
  END,
  name;

-- ============================================
-- ŠTATISTIKA
-- ============================================
-- Koľko pízz má gramáž a alergény
SELECT 
  COUNT(*) as total_pizzas,
  COUNT("weightGrams") as pizzas_with_weight,
  COUNT(CASE WHEN array_length(allergens, 1) > 0 THEN 1 END) as pizzas_with_allergens
FROM products 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA';

