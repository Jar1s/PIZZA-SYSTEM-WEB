CREATE TABLE IF NOT EXISTS "storyous_modifier_mappings" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "optionId" TEXT NOT NULL,
  "externalAdditionId" TEXT NOT NULL,
  "labelOverride" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "storyous_modifier_mappings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "storyous_modifier_mappings_tenantId_optionId_key"
  ON "storyous_modifier_mappings"("tenantId", "optionId");

CREATE INDEX IF NOT EXISTS "storyous_modifier_mappings_tenantId_idx"
  ON "storyous_modifier_mappings"("tenantId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'storyous_modifier_mappings_tenantId_fkey'
  ) THEN
    ALTER TABLE "storyous_modifier_mappings"
      ADD CONSTRAINT "storyous_modifier_mappings_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
