-- Remove database trigger/function that locks product description field
-- Run this in Supabase SQL Editor

-- First, let's see the current function definition
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'prevent_product_field_updates'
  AND n.nspname = 'public';

-- Option 1: Update the function to allow description updates
-- (Keep protection for name and priceCents, but allow description)
CREATE OR REPLACE FUNCTION prevent_product_field_updates()
RETURNS TRIGGER AS $$
BEGIN
    -- Only protect name and priceCents, allow description updates
    IF OLD.name IS DISTINCT FROM NEW.name THEN
        RAISE EXCEPTION 'Cannot update product name. Field is locked.';
    END IF;
    
    IF OLD."priceCents" IS DISTINCT FROM NEW."priceCents" THEN
        RAISE EXCEPTION 'Cannot update product priceCents. Field is locked.';
    END IF;
    
    -- Description is now allowed to be updated
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Option 2: If you want to completely remove the trigger (uncomment below)
-- DROP TRIGGER IF EXISTS lock_product_fields_trigger ON products;
-- DROP FUNCTION IF EXISTS prevent_product_field_updates() CASCADE;
