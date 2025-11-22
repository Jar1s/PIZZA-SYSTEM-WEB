-- Restore PornoPizza brand if it was deleted
-- This script will create or update the PornoPizza tenant

INSERT INTO tenants (
  id,
  slug,
  name,
  domain,
  subdomain,
  "isActive",
  "paymentProvider",
  currency,
  theme,
  "paymentConfig",
  "deliveryConfig",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid()::text,
  'pornopizza',
  'PornoPizza',
  'pornopizza.sk',
  'pornopizza',
  true, -- Set to active by default
  'adyen',
  'EUR',
  '{
    "primaryColor": "#E91E63",
    "secondaryColor": "#0F141A",
    "logo": "/logos/pornopizza.svg",
    "favicon": "/favicons/pornopizza.ico",
    "fontFamily": "Inter",
    "layout": {
      "headerStyle": "dark",
      "backgroundStyle": "black",
      "showPizzaSlices": true,
      "useCustomLogo": true,
      "customLogoComponent": "PornoPizzaLogo",
      "useCustomBackground": true,
      "customBackgroundClass": "porno-bg",
      "bodyBackgroundClass": "bg-porno-vibe"
    },
    "maintenanceMode": false
  }'::jsonb,
  '{
    "provider": "adyen",
    "merchantAccount": "TestMerchant"
  }'::jsonb,
  '{
    "provider": "wolt",
    "apiKey": "test_key"
  }'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (slug) 
DO UPDATE SET 
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  subdomain = EXCLUDED.subdomain,
  "isActive" = COALESCE(EXCLUDED."isActive", tenants."isActive"), -- Preserve existing isActive if it was false
  "paymentProvider" = EXCLUDED."paymentProvider",
  currency = EXCLUDED.currency,
  theme = EXCLUDED.theme,
  "paymentConfig" = EXCLUDED."paymentConfig",
  "deliveryConfig" = EXCLUDED."deliveryConfig",
  "updatedAt" = NOW();

-- Verify the tenant was created/updated
SELECT 
  id,
  slug,
  name,
  domain,
  subdomain,
  "isActive",
  "createdAt",
  "updatedAt"
FROM tenants
WHERE slug = 'pornopizza';

