-- Safe manual migration bundle for PornoPizza go-live.
-- Run once in Supabase SQL Editor if Prisma migrations were not deployed.

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "clientRequestId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "orders_tenantId_clientRequestId_key"
ON "orders"("tenantId", "clientRequestId");

CREATE INDEX IF NOT EXISTS "orders_tenantId_clientRequestId_idx"
ON "orders"("tenantId", "clientRequestId");

CREATE TABLE IF NOT EXISTS "tenant_order_counters" (
  "tenantId" TEXT NOT NULL,
  "lastOrderNumber" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tenant_order_counters_pkey" PRIMARY KEY ("tenantId")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'tenant_order_counters_tenantId_fkey'
  ) THEN
    ALTER TABLE "tenant_order_counters"
      ADD CONSTRAINT "tenant_order_counters_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "tenant_order_counters" ("tenantId", "lastOrderNumber", "createdAt", "updatedAt")
SELECT
  o."tenantId",
  COALESCE(MAX(o."orderNumber"), 0),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "orders" o
GROUP BY o."tenantId"
ON CONFLICT ("tenantId") DO UPDATE
SET
  "lastOrderNumber" = GREATEST(
    "tenant_order_counters"."lastOrderNumber",
    EXCLUDED."lastOrderNumber"
  ),
  "updatedAt" = CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS "storyous_modifier_mappings" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "optionId" TEXT NOT NULL,
  "externalAdditionId" TEXT NOT NULL,
  "labelOverride" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "storyous_modifier_mappings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "storyous_modifier_mappings_tenantId_optionId_key"
ON "storyous_modifier_mappings"("tenantId", "optionId");

CREATE INDEX IF NOT EXISTS "storyous_modifier_mappings_tenantId_idx"
ON "storyous_modifier_mappings"("tenantId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'storyous_modifier_mappings_tenantId_fkey'
  ) THEN
    ALTER TABLE "storyous_modifier_mappings"
      ADD CONSTRAINT "storyous_modifier_mappings_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
