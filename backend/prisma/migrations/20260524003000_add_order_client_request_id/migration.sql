ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "clientRequestId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "orders_tenantId_clientRequestId_key"
ON "orders"("tenantId", "clientRequestId");

CREATE INDEX IF NOT EXISTS "orders_tenantId_clientRequestId_idx"
ON "orders"("tenantId", "clientRequestId");
