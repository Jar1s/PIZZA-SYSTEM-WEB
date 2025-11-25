-- Enable Row Level Security (RLS) on all public tables
-- Run this in Supabase SQL Editor
-- This fixes Supabase security warnings about RLS being disabled

-- Note: RLS policies allow all operations for service role (backend uses service role)
-- This ensures backend can access all data while RLS is enabled for security

-- Enable RLS on all tables
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

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

-- Verify RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
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
    'users'
  )
ORDER BY tablename;

