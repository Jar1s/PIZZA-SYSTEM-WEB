-- Ensure PornoPizza tenant uses PornoPizzaLogo component everywhere
-- This script ensures the logo is set correctly in the database

UPDATE tenants
SET theme = jsonb_set(
  COALESCE(theme, '{}'::jsonb),
  '{layout}',
  jsonb_build_object(
    'headerStyle', COALESCE((theme->'layout'->>'headerStyle'), 'dark'),
    'backgroundStyle', COALESCE((theme->'layout'->>'backgroundStyle'), 'black'),
    'useCustomLogo', true,
    'customLogoComponent', 'PornoPizzaLogo',
    'useCustomBackground', COALESCE((theme->'layout'->>'useCustomBackground')::boolean, true),
    'customBackgroundClass', COALESCE((theme->'layout'->>'customBackgroundClass'), 'porno-bg'),
    'bodyBackgroundClass', COALESCE((theme->'layout'->>'bodyBackgroundClass'), 'bg-porno-vibe')
  ),
  true
)
WHERE slug = 'pornopizza';

-- Verify the update
SELECT 
  slug,
  theme->'layout'->>'useCustomLogo' as useCustomLogo,
  theme->'layout'->>'customLogoComponent' as customLogoComponent
FROM tenants
WHERE slug = 'pornopizza';

