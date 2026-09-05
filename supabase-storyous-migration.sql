-- Migration: Add GlobalSettings table for Storyous configuration
-- Run this in Supabase SQL Editor

-- Create global_settings table
CREATE TABLE IF NOT EXISTS "global_settings" (
    "id" TEXT NOT NULL,
    "storyous" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("id")
);

-- Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS "global_settings_id_idx" ON "global_settings"("id");

-- Insert initial global settings record (optional - can be done via API)
-- Uncomment the following to insert initial settings:
/*
INSERT INTO "global_settings" ("id", "storyous", "createdAt", "updatedAt")
VALUES (
    'global',
    '{
        "clientId": "692eba51dc0b299f172d5893",
        "clientSecret": "op6V11jOLpHaXq1B",
        "merchantId": "690da5715b2744002d9cf9cb",
        "placeId": "690da5715b2744002d9cf9ce",
        "enabled": false,
        "autoSync": false
    }'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT ("id") DO NOTHING;
*/

-- Verify table was created
SELECT * FROM "global_settings" WHERE "id" = 'global';







