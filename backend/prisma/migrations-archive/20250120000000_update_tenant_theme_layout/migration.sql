-- Migration: Update tenant theme with layout configuration
-- This migration adds layout configuration to existing tenant themes

-- Update Pornopizza tenant
UPDATE tenants
SET theme = jsonb_set(
  theme,
  '{layout}',
  '{
    "headerStyle": "dark",
    "backgroundStyle": "black",
    "useCustomLogo": true,
    "customLogoComponent": "PornoPizzaLogo",
    "useCustomBackground": true,
    "customBackgroundClass": "porno-bg"
  }'::jsonb,
  true
)
WHERE slug = 'pornopizza'
  AND (theme->'layout' IS NULL OR theme->'layout' = 'null'::jsonb);

-- Update Pizza v Núdzi tenant
UPDATE tenants
SET theme = jsonb_set(
  theme,
  '{layout}',
  '{
    "headerStyle": "light",
    "backgroundStyle": "white",
    "useCustomLogo": false
  }'::jsonb,
  true
)
WHERE slug = 'pizzavnudzi'
  AND (theme->'layout' IS NULL OR theme->'layout' = 'null'::jsonb);

-- Update all other tenants with default light theme
UPDATE tenants
SET theme = jsonb_set(
  theme,
  '{layout}',
  '{
    "headerStyle": "light",
    "backgroundStyle": "white",
    "useCustomLogo": false
  }'::jsonb,
  true
)
WHERE slug NOT IN ('pornopizza', 'pizzavnudzi')
  AND (theme->'layout' IS NULL OR theme->'layout' = 'null'::jsonb);

