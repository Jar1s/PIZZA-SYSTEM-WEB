-- Migration: Change displayNameSk and displayNameEn to single displayName field
-- This migration:
-- 1. Creates new displayName column
-- 2. Migrates data from displayNameSk (preferred) or displayNameEn to displayName
-- 3. Drops old columns

-- Step 1: Add new displayName column
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "displayName" TEXT;

-- Step 2: Migrate data (prefer displayNameSk, fallback to displayNameEn)
UPDATE "products" 
SET "displayName" = COALESCE("displayNameSk", "displayNameEn")
WHERE "displayNameSk" IS NOT NULL OR "displayNameEn" IS NOT NULL;

-- Step 3: Drop old columns
ALTER TABLE "products" DROP COLUMN IF EXISTS "displayNameSk";
ALTER TABLE "products" DROP COLUMN IF EXISTS "displayNameEn";
