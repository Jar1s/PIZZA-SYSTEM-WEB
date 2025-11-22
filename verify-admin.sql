-- Overenie vytvorených účtov
SELECT id, username, name, role, "isActive", "createdAt"
FROM users
WHERE username IN ('admin', 'operator')
ORDER BY username;

-- Ak nevidíš účty, skús vytvoriť znova s explicitným ID:
-- (Spusti len ak predchádzajúci SELECT nevrátil riadky)

-- Vytvor admin účet s explicitným ID
INSERT INTO users (id, username, password, name, role, "isActive", "createdAt", "updatedAt")
VALUES (
  'clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 21),  -- CUID-like ID
  'admin',
  '$2b$10$blzp7CvimQf58vs7pxXHWe0irdqBcz7aDGkG5tm.TvImmquDR.CIG',
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

-- Vytvor operator účet s explicitným ID
INSERT INTO users (id, username, password, name, role, "isActive", "createdAt", "updatedAt")
VALUES (
  'clx' || substr(md5(random()::text || clock_timestamp()::text), 1, 21),  -- CUID-like ID
  'operator',
  '$2b$10$PdOpS9lj94VJrFE654dVTePsVnEv43opmIXRKCEu1D3o/Rs/OZ.uu',
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
