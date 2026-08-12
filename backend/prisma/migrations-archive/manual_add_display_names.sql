-- Manual migration: Add displayNameSk and displayNameEn to products table
-- Run this if automatic migration fails

ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "displayNameSk" TEXT,
ADD COLUMN IF NOT EXISTS "displayNameEn" TEXT;
