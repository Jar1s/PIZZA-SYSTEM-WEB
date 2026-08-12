-- This migration is a no-op if username already exists
-- The first migration (20251105234103_add_user_auth) already created username column

-- Check if email column exists, if so migrate from email to username
DO $$
BEGIN
  -- Only run if email column exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'email'
  ) THEN
    -- Add username column if it doesn't exist
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;
    
    -- Update existing users: extract username from email
    UPDATE "users" SET "username" = CASE 
      WHEN "email" = 'admin@pizza.sk' THEN 'admin'
      WHEN "email" = 'operator@pizza.sk' THEN 'operator'
      ELSE SPLIT_PART("email", '@', 1)
    END
    WHERE "username" IS NULL;
    
    -- Make username NOT NULL
    ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
    
    -- Drop email column and its index
    DROP INDEX IF EXISTS "users_email_key";
    DROP INDEX IF EXISTS "users_email_idx";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "email";
  END IF;
END $$;

-- Ensure unique index on username exists
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users"("username");

