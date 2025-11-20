-- CreateTable
CREATE TABLE IF NOT EXISTS "product_mappings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalIdentifier" TEXT NOT NULL,
    "internalProductName" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "product_mappings_tenantId_externalIdentifier_source_key" 
    ON "product_mappings"("tenantId", "externalIdentifier", "source");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_mappings_tenantId_externalIdentifier_idx" 
    ON "product_mappings"("tenantId", "externalIdentifier");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_mappings_internalProductName_idx" 
    ON "product_mappings"("internalProductName");

-- AddForeignKey
ALTER TABLE "product_mappings" ADD CONSTRAINT "product_mappings_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;








