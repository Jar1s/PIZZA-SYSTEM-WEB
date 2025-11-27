-- ============================================
-- KOMPLETNÝ SQL SKRIPT: Pridanie gramáže a alergénov
-- ============================================
-- Spustite v Supabase SQL Editori

-- ============================================
-- KROK 1: PRIDANIE STĹPCOV (ak ešte nie sú)
-- ============================================
ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "weightGrams" INTEGER,
ADD COLUMN IF NOT EXISTS "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- ============================================
-- KROK 2: UPDATE PODĽA DESCRIPTION (flexibilné)
-- ============================================
-- Tento skript používa description na identifikáciu produktov
-- Funguje aj pri zmenených názvoch

-- Vyskladaj si vlastnú pizzu - no weight/allergens (závisí od výberu)
UPDATE products 
SET "weightGrams" = NULL,
    allergens = ARRAY[]::TEXT[]
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (name LIKE '%vlastnú%' OR name LIKE '%Build Your Own%' OR name = 'Vyskladaj si vlastnú pizzu');

-- Margherita - 450g, (1,7) - "Paradajkový základ, mozzarella"
UPDATE products 
SET "weightGrams" = 450,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Margherita' 
    OR name = 'Pizza Margherita'
    OR (description LIKE '%Paradajkový základ, mozzarella%' AND description LIKE '%základ každého potešenia%')
  );

-- Prosciutto - 500g, (1,7) - "Paradajkový základ, mozzarella, šunka"
UPDATE products 
SET "weightGrams" = 500,
    allergens = ARRAY['1', '7']
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND (
    name = 'Prosciutto'
    OR name = 'Pizza Prosciutto'
    OR (description LIKE '%Paradajkový základ, mozzarella, šunka%' AND description LIKE '%vyzývavá%')
  );

-- Bon Salami - 500g, (1,7) - "Paradajkový základ, mozzarella, saláma"
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

-- Picante - 520g, (1,7) - "Paradajkový základ, mozzarella, feferóny, pikantná saláma"
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

-- Calimero - 520g, (1,3,7) - "Paradajkový základ, mozzarella, šunka, kukurica"
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

-- Prosciutto Funghi - 520g, (1,7) - "Paradajkový základ, mozzarella, šunka, šampiňóny"
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

-- Hawaii Premium - 520g, (1,7) - "Paradajkový základ, mozzarella, šunka, ananás"
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

-- Capri - 520g, (1,7) - "Paradajkový základ, mozzarella, šunka, kukurica"
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

-- Da Vinci - 520g, (1,7) - "Paradajkový základ, mozzarella, šunka, slanina, niva, olivy"
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

-- Quattro Stagioni - 520g, (1,7) - "Paradajkový základ, mozzarella, šunka, šampiňóny, olivy, artičoky"
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

-- Mayday Special - 520g, (1,7) - "Paradajkový základ, mozzarella, šunka, slanina, kukurica, vajce"
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

-- Provinciale - 520g, (1,7) - "Paradajkový základ, mozzarella, šunka, slanina, kukurica, baranie rohy"
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

-- Quattro Formaggi - 520g, (1,7) - "Paradajkový základ, mozzarella, niva, eidam, parmezán"
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

-- Quattro Formaggi Bianco - 520g, (1,7) - "Smotanový základ, mozzarella, niva, eidam, parmezán"
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

-- Tonno - 520g, (1,4,7) - "Paradajkový základ, mozzarella, tuniak, cibuľa"
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

-- Vegetariana Premium - 520g, (1,7) - "Paradajkový základ, mozzarella, brokolica, kukurica, šampiňóny, baby špenát"
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

-- Fregata - 520g, (1,7) - "Paradajkový základ, mozzarella, niva, šampiňóny, cibuľa, olivy, vajce"
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

-- Diavola Premium - 520g, (1,7) - "Paradajkový základ, chilli, mozzarella, pikantná saláma, baranie rohy, feferóny"
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

-- Pivárska - 520g, (1,7) - "Paradajkový základ, mozzarella, saláma, slanina, klobása, cibuľa, niva"
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

-- Gazdovská - 520g, (1,7) - "Paradajkový základ, mozzarella, slanina, cibuľa, šampiňóny, saláma"
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

-- Basil Pesto Premium - 520g, (1,7) - "Bazalkové pesto, mozzarella, šunka, ricotta, paradajky, parmezán"
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

-- Honey Chilli - 520g, (1,7) - "Paradajkový základ, mozzarella, kuracie prsia, med, chilli, ananás, cesnak, oregáno"
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

-- Pollo Crema - 520g, (1,7) - "Smotanový základ, mozzarella, kuracie prsia, niva, kukurica, brokolica"
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

-- Prosciutto Crudo Premium - 520g, (1,7) - "Paradajkový základ, mozzarella, prosciutto crudo, paradajky, rukola, parmezán"
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
SELECT 
  name,
  description,
  "weightGrams",
  allergens,
  ("priceCents"::float / 100)::numeric(10,2) as price_eur
FROM products 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
ORDER BY 
  CASE 
    WHEN "weightGrams" IS NULL THEN 999
    ELSE "weightGrams"
  END,
  name;

