-- Create global_settings table for platform-wide configuration (e.g., Storyous)
CREATE TABLE "global_settings" (
    "id" TEXT NOT NULL,
    "storyous" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("id")
);

-- Index for lookups
CREATE INDEX "global_settings_id_idx" ON "global_settings"("id");
