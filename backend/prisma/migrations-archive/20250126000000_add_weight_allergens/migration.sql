-- AlterTable: Add weightGrams and allergens columns
-- This migration is idempotent (safe to run multiple times)
-- Columns may already exist if added manually in Supabase

ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "weightGrams" INTEGER,
ADD COLUMN IF NOT EXISTS "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[];

