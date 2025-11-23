-- ============================================
-- Pridanie passwordResetToken a passwordResetExpires stĺpcov do users tabuľky
-- ============================================
-- Spusti tento SQL v Supabase SQL Editor
-- ============================================

-- Pridaj passwordResetToken stĺpec (ak neexistuje)
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT;

-- Pridaj passwordResetExpires stĺpec (ak neexistuje)
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP;

-- Vytvor unique index pre passwordResetToken (ak neexistuje)
CREATE UNIQUE INDEX IF NOT EXISTS "users_passwordResetToken_key" 
ON "users"("passwordResetToken") 
WHERE "passwordResetToken" IS NOT NULL;

-- Vytvor index pre vyhľadávanie (ak neexistuje)
CREATE INDEX IF NOT EXISTS "users_passwordResetToken_idx" 
ON "users"("passwordResetToken") 
WHERE "passwordResetToken" IS NOT NULL;

-- Overenie
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('passwordResetToken', 'passwordResetExpires')
ORDER BY column_name;

