CREATE TABLE "tenant_order_counters" (
  "tenantId" TEXT NOT NULL,
  "lastOrderNumber" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "tenant_order_counters_pkey" PRIMARY KEY ("tenantId"),
  CONSTRAINT "tenant_order_counters_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);
