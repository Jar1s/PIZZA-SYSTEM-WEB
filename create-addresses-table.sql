-- Create addresses table
-- Run this in your database (Supabase SQL Editor or Render database console)

-- CreateTable
CREATE TABLE IF NOT EXISTS "addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'SK',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "addresses_userId_idx" ON "addresses"("userId");
CREATE INDEX IF NOT EXISTS "addresses_userId_isPrimary_idx" ON "addresses"("userId", "isPrimary");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'addresses_userId_fkey'
    ) THEN
        ALTER TABLE "addresses" 
        ADD CONSTRAINT "addresses_userId_fkey" 
        FOREIGN KEY ("userId") 
        REFERENCES "users"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- Enable RLS (if not already enabled)
ALTER TABLE IF EXISTS "addresses" ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'addresses' 
        AND policyname = 'Allow all for service role'
    ) THEN
        CREATE POLICY "Allow all for service role" ON "addresses"
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

