-- ============================================
-- Vytvorenie Admin a Operator účtov
-- ============================================
-- Spusti tento SQL v Supabase SQL Editor
-- 1. Choď na: https://supabase.com/dashboard
-- 2. Vyber svoj projekt
-- 3. Klikni na "SQL Editor"
-- 4. Vlož tento SQL a klikni "Run"
-- ============================================

-- Vytvor admin účet (alebo aktualizuj, ak už existuje)
INSERT INTO users (id, username, password, name, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'admin',
  '$2b$10$blzp7CvimQf58vs7pxXHWe0irdqBcz7aDGkG5tm.TvImmquDR.CIG',  -- hash pre admin123
  'Admin User',
  'ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username) 
DO UPDATE SET 
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- Vytvor operator účet (alebo aktualizuj, ak už existuje)
INSERT INTO users (id, username, password, name, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'operator',
  '$2b$10$PdOpS9lj94VJrFE654dVTePsVnEv43opmIXRKCEu1D3o/Rs/OZ.uu',  -- hash pre operator123
  'Operator User',
  'OPERATOR',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username) 
DO UPDATE SET 
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- Overenie (voliteľné - zobrazí vytvorené účty)
SELECT id, username, name, role, "isActive", "createdAt"
FROM users
WHERE username IN ('admin', 'operator')
ORDER BY username;

