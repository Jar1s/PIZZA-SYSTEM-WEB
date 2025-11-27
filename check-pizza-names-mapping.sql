-- ============================================
-- SKRIPT: Kontrola mapovania názvov pizze
-- ============================================
-- Porovnáva názvy v databáze s mapovaním v product-translations.ts
-- Podľa tabuľky: Pizza original → Web

-- Zobraziť všetky pizze v databáze
SELECT 
    name AS "Original názov v DB",
    description AS "Popis",
    "priceCents" / 100.0 AS "Cena (€)",
    "isActive" AS "Aktívna"
FROM products
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
ORDER BY name;

-- ============================================
-- MAPOVANIE PODĽA TABUĽKY:
-- ============================================
-- Pizza original → Web názov (podľa product-translations.ts)
-- 
-- ✅ SPRÁVNE MAPOVANÉ:
-- Pizza Margherita → Margherita Nuda (key: 'Margherita')
-- Pizza Prosciutto → Prosciutto Tease (key: 'Prosciutto')
-- Pizza Bon Salami → Salami 69 (key: 'Bon Salami')
-- Pizza Picante → Hot Fantasy (key: 'Picante')
-- Pizza Calimero → Calimero Quickie (key: 'Calimero')
-- Pizza Prosciutto Funghi → Shroom Affair (key: 'Prosciutto Funghi')
-- Pizza Hawai → Hawai Crush (key: 'Hawaii Premium' - možno treba 'Hawaii' alebo 'Pizza Hawai')
-- Pizza Capri → Corny Love (key: 'Capri')
-- Pizza Da Vinci → Da Vinci Desire (key: 'Da Vinci')
-- Pizza Quattro Stagioni → Mixtape of Sins (key: 'Quattro Stagioni')
-- Pizza Provinciale → Country Affair (key: 'Provinciale')
-- Pizza Quattro Formaggi → Four Cheese Fetish (key: 'Quattro Formaggi')
-- Pizza Quattro Formaggi Bianco → White Dream (key: 'Quattro Formaggi Bianco')
-- Pizza Tuniaková → Tuna Affair (key: 'Tonno')
-- Pizza Vegetariana → Veggie Pleasure (key: 'Vegetariana Premium')
-- Pizza Gazdovská → Gazda Deluxe (key: 'Gazdovská')
-- Pizza Bazila Pesto → Pesto Affair (key: 'Basil Pesto Premium')
-- Pizza Med-Chilli → Honey Temptation (key: 'Honey Chilli')
-- Pizza Pollo Crema → Pollo Creamy Dream (key: 'Pollo Crema')
-- Pizza Prosciutto Crudo → Crudo Affair (key: 'Prosciutto Crudo Premium')
--
-- ❌ NESPRÁVNE MAPOVANÉ (treba opraviť v product-translations.ts):
-- Pizza Fregata → Fregata Missionary (teraz: 'Fregata' → 'Pizza Fregata')
-- Pizza Diavola → Hot Dominant (teraz: 'Diavola Premium' → 'Diavola Dominant')
-- Pizza Pivárska → Hotline Pizza (teraz: 'Pivárska' → 'Pizza Pivárska')
--
-- ❓ CHÝBAJÚCE:
-- Pizza Mayday → Mayday Affair (nie je v product-translations.ts, je len 'Mayday Special' → 'Bacon Affair')
-- Vyskladaj si vlastnú pizzu → (nie je v Web stĺpci, ale je v product-translations.ts)

-- ============================================
-- KONTROLA KONKRÉTNYCH NÁZVOV:
-- ============================================

-- Skontrolovať, či existujú tieto názvy v DB:
SELECT 
    name,
    CASE 
        WHEN name = 'Margherita' THEN '✅ Mapuje na: Margherita Nuda'
        WHEN name = 'Pizza Margherita' THEN '⚠️ Treba mapovať na: Margherita Nuda (key: Margherita)'
        WHEN name = 'Prosciutto' THEN '✅ Mapuje na: Prosciutto Tease'
        WHEN name = 'Pizza Prosciutto' THEN '⚠️ Treba mapovať na: Prosciutto Tease (key: Prosciutto)'
        WHEN name = 'Bon Salami' THEN '✅ Mapuje na: Salami 69'
        WHEN name = 'Pizza Bon Salami' THEN '⚠️ Treba mapovať na: Salami 69 (key: Bon Salami)'
        WHEN name = 'Picante' THEN '✅ Mapuje na: Hot Fantasy'
        WHEN name = 'Pizza Picante' THEN '⚠️ Treba mapovať na: Hot Fantasy (key: Picante)'
        WHEN name = 'Calimero' THEN '✅ Mapuje na: Calimero Quickie'
        WHEN name = 'Pizza Calimero' THEN '⚠️ Treba mapovať na: Calimero Quickie (key: Calimero)'
        WHEN name = 'Prosciutto Funghi' THEN '✅ Mapuje na: Shroom Affair'
        WHEN name = 'Pizza Prosciutto Funghi' THEN '⚠️ Treba mapovať na: Shroom Affair (key: Prosciutto Funghi)'
        WHEN name = 'Hawaii' OR name = 'Hawaii Premium' THEN '✅ Mapuje na: Hawai Crush'
        WHEN name = 'Pizza Hawai' THEN '⚠️ Treba mapovať na: Hawai Crush (key: Hawaii Premium alebo Hawaii)'
        WHEN name = 'Capri' THEN '✅ Mapuje na: Corny Love'
        WHEN name = 'Pizza Capri' THEN '⚠️ Treba mapovať na: Corny Love (key: Capri)'
        WHEN name = 'Da Vinci' THEN '✅ Mapuje na: Da Vinci Desire'
        WHEN name = 'Pizza Da Vinci' THEN '⚠️ Treba mapovať na: Da Vinci Desire (key: Da Vinci)'
        WHEN name = 'Quattro Stagioni' THEN '✅ Mapuje na: Mixtape of Sins'
        WHEN name = 'Pizza Quattro Stagioni' THEN '⚠️ Treba mapovať na: Mixtape of Sins (key: Quattro Stagioni)'
        WHEN name = 'Mayday' OR name = 'Mayday Special' THEN '⚠️ Treba mapovať na: Mayday Affair (key: Mayday)'
        WHEN name = 'Pizza Mayday' THEN '⚠️ Treba mapovať na: Mayday Affair (key: Mayday)'
        WHEN name = 'Provinciale' THEN '✅ Mapuje na: Country Affair'
        WHEN name = 'Pizza Provinciale' THEN '⚠️ Treba mapovať na: Country Affair (key: Provinciale)'
        WHEN name = 'Quattro Formaggi' THEN '✅ Mapuje na: Four Cheese Fetish'
        WHEN name = 'Pizza Quattro Formaggi' THEN '⚠️ Treba mapovať na: Four Cheese Fetish (key: Quattro Formaggi)'
        WHEN name = 'Quattro Formaggi Bianco' THEN '✅ Mapuje na: White Dream'
        WHEN name = 'Pizza Quattro Formaggi Bianco' THEN '⚠️ Treba mapovať na: White Dream (key: Quattro Formaggi Bianco)'
        WHEN name = 'Tonno' OR name = 'Tuniaková' THEN '✅ Mapuje na: Tuna Affair'
        WHEN name = 'Pizza Tuniaková' THEN '⚠️ Treba mapovať na: Tuna Affair (key: Tonno)'
        WHEN name = 'Vegetariana Premium' THEN '✅ Mapuje na: Veggie Pleasure'
        WHEN name = 'Pizza Vegetariana' THEN '⚠️ Treba mapovať na: Veggie Pleasure (key: Vegetariana Premium)'
        WHEN name = 'Fregata' THEN '❌ Mapuje na: Pizza Fregata (MALO BY: Fregata Missionary)'
        WHEN name = 'Pizza Fregata' THEN '❌ Treba mapovať na: Fregata Missionary (key: Fregata)'
        WHEN name = 'Diavola Premium' THEN '❌ Mapuje na: Diavola Dominant (MALO BY: Hot Dominant)'
        WHEN name = 'Pizza Diavola' THEN '❌ Treba mapovať na: Hot Dominant (key: Diavola alebo Diavola Premium)'
        WHEN name = 'Pivárska' THEN '❌ Mapuje na: Pizza Pivárska (MALO BY: Hotline Pizza)'
        WHEN name = 'Pizza Pivárska' THEN '❌ Treba mapovať na: Hotline Pizza (key: Pivárska)'
        WHEN name = 'Gazdovská' THEN '✅ Mapuje na: Gazda Deluxe'
        WHEN name = 'Pizza Gazdovská' THEN '⚠️ Treba mapovať na: Gazda Deluxe (key: Gazdovská)'
        WHEN name = 'Basil Pesto Premium' THEN '✅ Mapuje na: Pesto Affair'
        WHEN name = 'Pizza Bazila Pesto' THEN '⚠️ Treba mapovať na: Pesto Affair (key: Basil Pesto Premium)'
        WHEN name = 'Honey Chilli' THEN '✅ Mapuje na: Honey Temptation'
        WHEN name = 'Pizza Med-Chilli' THEN '⚠️ Treba mapovať na: Honey Temptation (key: Honey Chilli)'
        WHEN name = 'Pollo Crema' THEN '✅ Mapuje na: Pollo Creamy Dream'
        WHEN name = 'Pizza Pollo Crema' THEN '⚠️ Treba mapovať na: Pollo Creamy Dream (key: Pollo Crema)'
        WHEN name = 'Prosciutto Crudo Premium' THEN '✅ Mapuje na: Crudo Affair'
        WHEN name = 'Pizza Prosciutto Crudo' THEN '⚠️ Treba mapovať na: Crudo Affair (key: Prosciutto Crudo Premium)'
        ELSE '❓ Neznámy názov'
    END AS "Status mapovania"
FROM products
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
  AND "isActive" = true
ORDER BY name;

