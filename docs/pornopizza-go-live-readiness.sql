-- PornoPizza go-live readiness check.
-- Run in Supabase SQL Editor before deploying a backend that depends on the new production flow.
-- Expected: every `ok` column should be true; inspect `details` for missing configuration.

WITH pornopizza AS (
  SELECT
    id,
    slug,
    payment_config,
    delivery_config
  FROM (
    SELECT
      id,
      slug,
      "paymentConfig" AS payment_config,
      "deliveryConfig" AS delivery_config
    FROM "tenants"
    WHERE slug IN ('pornopizza', 'p0rnopizza')
    ORDER BY CASE WHEN slug = 'pornopizza' THEN 0 ELSE 1 END
    LIMIT 1
  ) tenant
),
required_tables AS (
  SELECT
    EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'tenant_order_counters'
    ) AS has_tenant_order_counters,
    EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'storyous_modifier_mappings'
    ) AS has_storyous_modifier_mappings,
    EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'deliveries'
    ) AS has_deliveries
),
required_columns AS (
  SELECT
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'clientRequestId'
    ) AS has_client_request_id,
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'orderNumber'
    ) AS has_order_number,
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'storyousOrderState'
    ) AS has_storyous_order_state
),
counter_state AS (
  SELECT
    p.id AS tenant_id,
    COALESCE(MAX(o."orderNumber"), 0) AS max_order_number,
    COALESCE(c."lastOrderNumber", -1) AS counter_order_number
  FROM pornopizza p
  LEFT JOIN "orders" o ON o."tenantId" = p.id
  LEFT JOIN "tenant_order_counters" c ON c."tenantId" = p.id
  GROUP BY p.id, c."lastOrderNumber"
),
storyous_state AS (
  SELECT
    p.id AS tenant_id,
    COUNT(m.id)::int AS mapped_modifier_count
  FROM pornopizza p
  LEFT JOIN "storyous_modifier_mappings" m ON m."tenantId" = p.id
  GROUP BY p.id
),
wolt_state AS (
  SELECT
    p.id AS tenant_id,
    NULLIF(TRIM(p.delivery_config #>> '{woltConfig,apiKey}'), '') IS NOT NULL AS has_api_key,
    NULLIF(TRIM(p.delivery_config #>> '{woltConfig,apiUrl}'), '') IS NOT NULL AS has_api_url,
    NULLIF(TRIM(p.delivery_config #>> '{woltConfig,merchantId}'), '') IS NOT NULL AS has_merchant_id,
    NULLIF(TRIM(p.delivery_config #>> '{woltConfig,venueId}'), '') IS NOT NULL AS has_venue_id,
    NULLIF(TRIM(p.delivery_config #>> '{pickupAddress,street}'), '') IS NOT NULL AS has_pickup_street,
    NULLIF(TRIM(p.delivery_config #>> '{pickupAddress,city}'), '') IS NOT NULL AS has_pickup_city,
    NULLIF(TRIM(p.delivery_config #>> '{pickupAddress,postalCode}'), '') IS NOT NULL AS has_pickup_postal_code,
    NULLIF(TRIM(p.delivery_config #>> '{pickupAddress,country}'), '') IS NOT NULL AS has_pickup_country
  FROM pornopizza p
)
SELECT
  'required_tables' AS check_name,
  (
    has_tenant_order_counters
    AND has_storyous_modifier_mappings
    AND has_deliveries
  ) AS ok,
  jsonb_build_object(
    'tenant_order_counters', has_tenant_order_counters,
    'storyous_modifier_mappings', has_storyous_modifier_mappings,
    'deliveries', has_deliveries
  ) AS details
FROM required_tables

UNION ALL

SELECT
  'required_order_columns' AS check_name,
  (
    has_client_request_id
    AND has_order_number
    AND has_storyous_order_state
  ) AS ok,
  jsonb_build_object(
    'clientRequestId', has_client_request_id,
    'orderNumber', has_order_number,
    'storyousOrderState', has_storyous_order_state
  ) AS details
FROM required_columns

UNION ALL

SELECT
  'pornopizza_tenant_exists' AS check_name,
  EXISTS (SELECT 1 FROM pornopizza) AS ok,
  COALESCE(
    (SELECT jsonb_build_object('tenantId', id, 'slug', slug) FROM pornopizza),
    '{}'::jsonb
  ) AS details

UNION ALL

SELECT
  'tenant_order_counter_backfilled' AS check_name,
  counter_order_number >= max_order_number AS ok,
  jsonb_build_object(
    'tenantId', tenant_id,
    'maxOrderNumber', max_order_number,
    'counterOrderNumber', counter_order_number
  ) AS details
FROM counter_state

UNION ALL

SELECT
  'storyous_modifier_mappings_present' AS check_name,
  mapped_modifier_count > 0 AS ok,
  jsonb_build_object(
    'tenantId', tenant_id,
    'mappedModifierCount', mapped_modifier_count
  ) AS details
FROM storyous_state

UNION ALL

SELECT
  'wolt_config_present' AS check_name,
  (
    has_api_key
    AND has_api_url
    AND has_merchant_id
    AND has_venue_id
    AND has_pickup_street
    AND has_pickup_city
    AND has_pickup_postal_code
    AND has_pickup_country
  ) AS ok,
  jsonb_build_object(
    'hasApiKey', has_api_key,
    'hasApiUrl', has_api_url,
    'hasMerchantId', has_merchant_id,
    'hasVenueId', has_venue_id,
    'hasPickupStreet', has_pickup_street,
    'hasPickupCity', has_pickup_city,
    'hasPickupPostalCode', has_pickup_postal_code,
    'hasPickupCountry', has_pickup_country
  ) AS details
FROM wolt_state
ORDER BY check_name;
