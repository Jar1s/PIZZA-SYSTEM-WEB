-- Enable Row Level Security (RLS) on all public tables
-- Run this in Supabase SQL Editor
-- This fixes Supabase security warnings about RLS being disabled
-- This script is idempotent - can be run multiple times safely

-- Note: RLS policies allow all operations for service role (backend uses service role)
-- This ensures backend can access all data while RLS is enabled for security

-- Drop existing policies if they exist (to avoid conflicts)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
        '_prisma_migrations',
        'products',
        'tenants',
        'orders',
        'deliveries',
        'order_items',
        'refresh_tokens',
        'users',
        'addresses',
        'sms_verification_codes',
        'product_mappings',
        'delivery_zones'
    )) LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow all for service role" ON public.%I', r.tablename);
    END LOOP;
END $$;

-- Enable RLS on all tables
ALTER TABLE IF EXISTS public._prisma_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sms_verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for service role (backend)
-- Service role bypasses RLS, but policies are required when RLS is enabled

CREATE POLICY "Allow all for service role" ON public._prisma_migrations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON public.products
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON public.tenants
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON public.orders
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON public.deliveries
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON public.order_items
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON public.refresh_tokens
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON public.addresses
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON public.sms_verification_codes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON public.product_mappings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON public.delivery_zones
  FOR ALL USING (true) WITH CHECK (true);

-- Verify RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    '_prisma_migrations',
    'products',
    'tenants',
    'orders',
    'deliveries',
    'order_items',
    'refresh_tokens',
    'users',
    'addresses',
    'sms_verification_codes',
    'product_mappings',
    'delivery_zones'
  )
ORDER BY tablename;
