-- =====================================================
-- TENANT CLONING - DATABASE MIGRATION
-- Run this in your SQL editor (Supabase, Render, etc.)
-- =====================================================

-- 1. Add emailConfig column to tenants table
-- This enables tenant-specific email configuration
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "emailConfig" JSONB NOT NULL DEFAULT '{}';

-- 2. Create audit_logs table
-- Tracks all tenant modifications for compliance
CREATE TABLE IF NOT EXISTS "audit_logs" (
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

-- 3. Create tenant_backups table
-- Enables rollback capability for sync operations
CREATE TABLE IF NOT EXISTS "tenant_backups" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tenant_backups_pkey" PRIMARY KEY ("id")
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS "audit_logs_tenantId_action_idx" ON "audit_logs"("tenantId", "action");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "tenant_backups_tenantId_idx" ON "tenant_backups"("tenantId");
CREATE INDEX IF NOT EXISTS "tenant_backups_expiresAt_idx" ON "tenant_backups"("expiresAt");

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify migration was successful
-- =====================================================

-- Check emailConfig column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tenants' AND column_name = 'emailConfig';

-- Check audit_logs table exists
SELECT COUNT(*) as audit_logs_exists FROM information_schema.tables 
WHERE table_name = 'audit_logs';

-- Check tenant_backups table exists
SELECT COUNT(*) as tenant_backups_exists FROM information_schema.tables 
WHERE table_name = 'tenant_backups';

-- Check indexes were created
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('audit_logs', 'tenant_backups')
ORDER BY indexname;

-- =====================================================
-- MIGRATION COMPLETE! ✅
-- =====================================================
-- After running this migration:
-- 1. Restart your backend server
-- 2. Go to http://localhost:3001/admin/brands (or your admin URL)
-- 3. Click "Clone Brand" to test the new feature
-- 4. See CLONING-QUICK-START.md for detailed testing steps
-- =====================================================
