-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "isBestSeller" BOOLEAN NOT NULL DEFAULT false;

