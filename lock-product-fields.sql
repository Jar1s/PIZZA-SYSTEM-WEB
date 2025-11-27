-- ============================================
-- LOCK PRODUCT FIELDS: name, description, priceCents
-- ============================================
-- Tento skript vytvorí trigger, ktorý zabráni UPDATE na chránené polia
-- Spustite v Supabase SQL Editori

-- KROK 1: Vytvorenie funkcie, ktorá zabráni zmenám
CREATE OR REPLACE FUNCTION prevent_product_field_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Ak sa pokúšame zmeniť name, description alebo priceCents, zachováme pôvodné hodnoty
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    RAISE EXCEPTION 'Cannot update product name. Field is locked.';
  END IF;
  
  IF OLD.description IS DISTINCT FROM NEW.description THEN
    RAISE EXCEPTION 'Cannot update product description. Field is locked.';
  END IF;
  
  IF OLD."priceCents" IS DISTINCT FROM NEW."priceCents" THEN
    RAISE EXCEPTION 'Cannot update product priceCents. Field is locked.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- KROK 2: Vytvorenie triggeru
DROP TRIGGER IF EXISTS lock_product_fields_trigger ON products;

CREATE TRIGGER lock_product_fields_trigger
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION prevent_product_field_updates();

-- KROK 3: Verifikácia
-- Skúste spustiť tento UPDATE (mal by zlyhať):
-- UPDATE products SET name = 'Test' WHERE id = (SELECT id FROM products LIMIT 1);
-- 
-- Mala by sa zobraziť chyba: "Cannot update product name. Field is locked."

-- ============================================
-- POZNÁMKA: Ak potrebujete zmeniť tieto polia v budúcnosti:
-- ============================================
-- 1. Dočasne odstráňte trigger:
--    DROP TRIGGER lock_product_fields_trigger ON products;
--
-- 2. Vykonajte potrebné zmeny
--
-- 3. Znovu vytvorte trigger:
--    CREATE TRIGGER lock_product_fields_trigger
--      BEFORE UPDATE ON products
--      FOR EACH ROW
--      EXECUTE FUNCTION prevent_product_field_updates();

