-- AlterTable: Add subHeader column
-- This migration is idempotent (safe to run multiple times)
-- Column may already exist if added manually

ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "subHeader" TEXT;
