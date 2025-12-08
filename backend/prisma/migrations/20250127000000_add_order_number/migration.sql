-- AlterTable: Add orderNumber column to orders table
-- This migration adds a nullable orderNumber field with unique constraint per tenant

ALTER TABLE "orders" 
ADD COLUMN IF NOT EXISTS "orderNumber" INTEGER;

-- Create unique constraint for tenantId + orderNumber combination
-- This ensures each tenant has unique order numbers
-- Using partial unique index to allow NULL values (multiple NULLs are allowed)
CREATE UNIQUE INDEX IF NOT EXISTS "orders_tenantId_orderNumber_key" 
ON "orders"("tenantId", "orderNumber") 
WHERE "orderNumber" IS NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "orders_tenantId_orderNumber_idx" 
ON "orders"("tenantId", "orderNumber");
