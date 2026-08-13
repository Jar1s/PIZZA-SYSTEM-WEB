-- Curated go-live sync (2026-08-13): additive-only subset of the drift between
-- production and 20260813000000_baseline. Deliberately NOT applied: DROP TABLE
-- notifications/partners/reviews/statistics, DROP INDEX products_tenantOverrides_idx,
-- default/precision realignments (harmless legacy drift).
-- Pre-checks run against prod before writing this file:
--   no duplicate (tenantId, orderNumber), no duplicate (slug, tenantId),
--   no duplicate passwordResetToken, zero NULL tenants.currency.

-- Refund tracking (needed by the new backend code)
ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "refundStatus" TEXT,
ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "refundError" TEXT;

-- SMS verification codes (in schema.prisma, never migrated to prod)
CREATE TABLE IF NOT EXISTS "sms_verification_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sms_verification_codes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "sms_verification_codes_phone_idx" ON "sms_verification_codes"("phone");
CREATE INDEX IF NOT EXISTS "sms_verification_codes_code_idx" ON "sms_verification_codes"("code");
CREATE INDEX IF NOT EXISTS "sms_verification_codes_expiresAt_idx" ON "sms_verification_codes"("expiresAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sms_verification_codes_userId_fkey'
  ) THEN
    ALTER TABLE "sms_verification_codes"
      ADD CONSTRAINT "sms_verification_codes_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Missing indexes (duplicates checked: none)
CREATE INDEX IF NOT EXISTS "orders_tenantId_createdAt_idx" ON "orders"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "orders_userId_idx" ON "orders"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "orders_tenantId_orderNumber_key" ON "orders"("tenantId", "orderNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_tenantId_key" ON "products"("slug", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "users_passwordResetToken_key" ON "users"("passwordResetToken");
CREATE INDEX IF NOT EXISTS "users_passwordResetToken_idx" ON "users"("passwordResetToken");

-- currency: 0 NULL rows verified, safe to align with schema
ALTER TABLE "tenants" ALTER COLUMN "currency" SET NOT NULL;
