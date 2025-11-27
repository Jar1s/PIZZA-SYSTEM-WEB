-- Migration: Add weightGrams and allergens columns to products table
-- Run this in Supabase SQL Editor BEFORE running Prisma migration

ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "weightGrams" INTEGER,
ADD COLUMN IF NOT EXISTS "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[];

