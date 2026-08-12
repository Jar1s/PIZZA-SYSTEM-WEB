-- CreateTable
CREATE TABLE "delivery_fee_tiers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "minDistanceMeters" INTEGER NOT NULL,
    "maxDistanceMeters" INTEGER NOT NULL,
    "deliveryFeeCents" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_fee_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_fee_tiers_tenantId_isActive_idx" ON "delivery_fee_tiers"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "delivery_fee_tiers_tenantId_priority_idx" ON "delivery_fee_tiers"("tenantId", "priority");

-- CreateIndex
CREATE INDEX "delivery_fee_tiers_isActive_priority_idx" ON "delivery_fee_tiers"("isActive", "priority");

-- AddForeignKey
ALTER TABLE "delivery_fee_tiers" ADD CONSTRAINT "delivery_fee_tiers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
