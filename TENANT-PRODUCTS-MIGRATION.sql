-- TENANT-PRODUCTS-MIGRATION.sql
-- Migration for tenant-specific products and product overrides
-- Run this migration after updating schema.prisma

-- 1. Check for duplicate slugs (run first, resolve manually if found)
-- SELECT slug, "tenantId", COUNT(*) 
-- FROM products 
-- GROUP BY slug, "tenantId" 
-- HAVING COUNT(*) > 1;

-- 2. Add slug field if missing (generate from name if needed)
ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Generate slugs from names for existing products (if slug is null)
UPDATE "products" 
SET "slug" = LOWER(REGEXP_REPLACE("name", '[^a-zA-Z0-9]+', '-', 'g'))
WHERE "slug" IS NULL OR "slug" = '';

-- Make slug NOT NULL after populating
ALTER TABLE "products" 
ALTER COLUMN "slug" SET NOT NULL;

-- 3. Make tenantId nullable
ALTER TABLE "products" 
ALTER COLUMN "tenantId" DROP NOT NULL;

-- 4. Set existing products to shared (null) - adjust logic based on requirements
-- Option A: Set all existing products to shared (null)
-- UPDATE "products" 
-- SET "tenantId" = NULL 
-- WHERE "tenantId" IN (SELECT id FROM tenants WHERE slug = 'pornopizza');

-- Option B: Keep current tenantId if products should remain tenant-specific
-- (No update needed in this case)

-- 5. Add tenantOverrides column
ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "tenantOverrides" JSONB DEFAULT '{}';

-- 6. Add unique constraint (slug, tenantId)
-- For products with tenantId (tenant-specific)
CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_tenantId_unique" 
ON "products"("slug", "tenantId") 
WHERE "tenantId" IS NOT NULL;

-- For shared products (tenantId = null), slug must be unique globally
CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_tenantId_null_unique" 
ON "products"("slug") 
WHERE "tenantId" IS NULL;

-- 7. Add index on tenantId for fast filtering
CREATE INDEX IF NOT EXISTS "products_tenantId_idx" 
ON "products"("tenantId");

-- 8. Add GIN index on tenantOverrides for JSON queries
CREATE INDEX IF NOT EXISTS "products_tenantOverrides_idx" 
ON "products" USING gin("tenantOverrides");

-- Verify migration
-- SELECT 
--   COUNT(*) as total_products,
--   COUNT(*) FILTER (WHERE "tenantId" IS NULL) as shared_products,
--   COUNT(*) FILTER (WHERE "tenantId" IS NOT NULL) as tenant_specific_products
-- FROM "products";
