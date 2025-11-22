-- ============================================
-- Pridanie userId stĺpca do orders tabuľky
-- ============================================
-- Spusti tento SQL v Supabase SQL Editor
-- ============================================

-- Pridaj userId stĺpec (ak neexistuje)
ALTER TABLE "orders" 
ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Vytvor foreign key constraint (ak neexistuje)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_userId_fkey'
  ) THEN
    ALTER TABLE "orders" 
    ADD CONSTRAINT "orders_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Vytvor index pre userId (ak neexistuje)
CREATE INDEX IF NOT EXISTS "orders_userId_idx" ON "orders"("userId") WHERE "userId" IS NOT NULL;

-- Overenie
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name = 'userId';

