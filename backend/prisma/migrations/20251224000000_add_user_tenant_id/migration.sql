-- Add tenantId to users and backfill based on recent orders
ALTER TABLE "users" ADD COLUMN "tenantId" TEXT;

WITH recent_orders AS (
  SELECT DISTINCT ON ("userId") "userId", "tenantId"
  FROM "orders"
  WHERE "userId" IS NOT NULL
  ORDER BY "userId", "createdAt" DESC
),
default_tenant AS (
  SELECT id FROM "tenants" WHERE slug = 'pornopizza' LIMIT 1
),
fallback_tenant AS (
  SELECT id FROM "tenants" LIMIT 1
)
UPDATE "users" u
SET "tenantId" = COALESCE(
  (SELECT ro."tenantId" FROM recent_orders ro WHERE ro."userId" = u.id),
  (SELECT id FROM default_tenant),
  (SELECT id FROM fallback_tenant)
)
WHERE "tenantId" IS NULL;

ALTER TABLE "users" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "users"
  ADD CONSTRAINT "users_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop global unique indexes for customer identifiers
DROP INDEX IF EXISTS "users_email_key";
DROP INDEX IF EXISTS "users_phone_key";
DROP INDEX IF EXISTS "users_googleId_key";
DROP INDEX IF EXISTS "users_appleId_key";

-- Drop old single-column indexes
DROP INDEX IF EXISTS "users_email_idx";
DROP INDEX IF EXISTS "users_phone_idx";

-- Add tenant-scoped unique constraints
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");
CREATE UNIQUE INDEX "users_tenantId_phone_key" ON "users"("tenantId", "phone");
CREATE UNIQUE INDEX "users_tenantId_googleId_key" ON "users"("tenantId", "googleId");
CREATE UNIQUE INDEX "users_tenantId_appleId_key" ON "users"("tenantId", "appleId");

-- Add tenant-scoped lookup indexes
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");
CREATE INDEX "users_tenantId_email_idx" ON "users"("tenantId", "email");
CREATE INDEX "users_tenantId_phone_idx" ON "users"("tenantId", "phone");
CREATE INDEX "users_tenantId_googleId_idx" ON "users"("tenantId", "googleId");
CREATE INDEX "users_tenantId_appleId_idx" ON "users"("tenantId", "appleId");
