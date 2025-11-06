-- AlterTable: Add username column
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

-- Create unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users"("username");

