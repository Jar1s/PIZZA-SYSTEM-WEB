-- Remove database trigger/function that locks product description field
-- Run this in Supabase SQL Editor

-- First, let's see what triggers exist on products table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'products';

-- Drop all triggers on products table that might be blocking description
DROP TRIGGER IF EXISTS prevent_product_description_update ON products;
DROP TRIGGER IF EXISTS check_product_update ON products;
DROP TRIGGER IF EXISTS protect_product_fields ON products;
DROP TRIGGER IF EXISTS products_update_trigger ON products;

-- Drop any functions that might be checking description
DROP FUNCTION IF EXISTS prevent_product_description_update() CASCADE;
DROP FUNCTION IF EXISTS check_product_update() CASCADE;
DROP FUNCTION IF EXISTS protect_product_fields() CASCADE;
DROP FUNCTION IF EXISTS products_update_check() CASCADE;

-- More aggressive: Find and drop ALL triggers on products table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'products'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON products CASCADE', r.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
    END LOOP;
END $$;
