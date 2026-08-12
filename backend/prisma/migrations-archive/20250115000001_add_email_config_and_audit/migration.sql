-- Add emailConfig field to tenants table
ALTER TABLE "tenants" ADD COLUMN "emailConfig" JSONB NOT NULL DEFAULT '{}';

-- Create audit_logs table
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "userId" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Create tenant_backups table
CREATE TABLE "tenant_backups" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_backups_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "audit_logs_tenantId_action_idx" ON "audit_logs"("tenantId", "action");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX "tenant_backups_tenantId_idx" ON "tenant_backups"("tenantId");
CREATE INDEX "tenant_backups_expiresAt_idx" ON "tenant_backups"("expiresAt");
