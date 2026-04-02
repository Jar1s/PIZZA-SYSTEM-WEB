-- Manual migration: Add subHeader column to products table
-- Run this in your production database (Supabase/Render/etc.)
-- This migration is idempotent (safe to run multiple times)

ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "subHeader" TEXT;
