-- ============================================
-- Pridanie phone a phoneVerified stĺpcov do users tabuľky
-- ============================================
-- Spusti tento SQL v Supabase SQL Editor
-- ============================================

-- Pridaj phone stĺpec (ak neexistuje)
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- Pridaj phoneVerified stĺpec (ak neexistuje)
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- Pridaj email stĺpec (ak neexistuje) - potrebný pre customer auth
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "email" TEXT;

-- Pridaj googleId stĺpec (ak neexistuje)
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "googleId" TEXT;

-- Pridaj appleId stĺpec (ak neexistuje)
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "appleId" TEXT;

-- Aktualizuj UserRole enum, ak CUSTOMER chýba
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'CUSTOMER' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
  ) THEN
    ALTER TYPE "UserRole" ADD VALUE 'CUSTOMER';
  END IF;
END $$;

-- Vytvor unique indexy (ak neexistujú)
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key" ON "users"("phone") WHERE "phone" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email") WHERE "email" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "users_googleId_key" ON "users"("googleId") WHERE "googleId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "users_appleId_key" ON "users"("appleId") WHERE "appleId" IS NOT NULL;

-- Vytvor indexy pre vyhľadávanie
CREATE INDEX IF NOT EXISTS "users_phone_idx" ON "users"("phone") WHERE "phone" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email") WHERE "email" IS NOT NULL;

-- Urob username nullable (ak nie je)
ALTER TABLE "users" 
ALTER COLUMN "username" DROP NOT NULL;

-- Urob password nullable (ak nie je)
ALTER TABLE "users" 
ALTER COLUMN "password" DROP NOT NULL;

-- Overenie
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('phone', 'phoneVerified', 'email', 'googleId', 'appleId')
ORDER BY column_name;

