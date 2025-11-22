# 🔍 Troubleshooting Admin Login

## ✅ SQL sa spustil úspešne

Ak vidíš "Success. No rows returned", znamená to, že SQL sa spustil, ale nevrátil žiadne dáta (to je normálne pre INSERT).

---

## 🧪 Krok 1: Over, či sa účet vytvoril

Spusti tento SQL v Supabase SQL Editor:

```sql
SELECT id, username, name, role, "isActive", "createdAt"
FROM users
WHERE username IN ('admin', 'operator')
ORDER BY username;
```

**Očakávaný výsledok:**
- Mala by sa zobraziť tabuľka s `admin` a `operator` účtami
- `role` by malo byť `ADMIN` a `OPERATOR`
- `isActive` by malo byť `true`

---

## ❌ Ak stále vidíš 500 error pri login

### Možnosť 1: Účet neexistuje
Ak SELECT nevrátil žiadne riadky, účet sa nevytvoril. Skús znova:

1. Spusti `create-admin.sql` znova v Supabase SQL Editor
2. Alebo použij `verify-admin.sql` (obsahuje aj overenie)

### Možnosť 2: Nesprávny role enum
Skontroluj, či je `role` správne nastavené:

```sql
-- Skontroluj, aké hodnoty má role enum
SELECT DISTINCT role FROM users;

-- Mala by sa zobraziť: ADMIN, OPERATOR, CUSTOMER
```

### Možnosť 3: Backend logy
Pozri sa na backend logy v Render.com:
1. Choď na: https://dashboard.render.com
2. Vyber backend service
3. Klikni na "Logs"
4. Skús sa prihlásiť a pozri sa na error

---

## 🧪 Krok 2: Test Login Endpoint

```bash
curl -X POST https://pizza-system-web.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Očakávaná odpoveď:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "...",
  "user": {
    "id": "...",
    "username": "admin",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

**Ak vidíš 500 error:**
- Pozri sa na backend logy
- Skontroluj, či účet existuje v databáze
- Skontroluj, či je `DATABASE_URL` správne nastavené v Render.com

---

## 🔧 Krok 3: Manuálne Overenie v Databáze

```sql
-- Zobraz všetky detaily admin účtu
SELECT 
  id,
  username,
  name,
  role,
  "isActive",
  CASE 
    WHEN password IS NULL THEN 'NULL'
    WHEN length(password) > 0 THEN 'HAS_PASSWORD'
    ELSE 'EMPTY'
  END as password_status,
  "createdAt"
FROM users
WHERE username = 'admin';
```

**Očakávaný výsledok:**
- `username`: `admin`
- `role`: `ADMIN`
- `isActive`: `true`
- `password_status`: `HAS_PASSWORD`

---

## 📝 Poznámky

- Hash hesla je správny: `$2b$10$blzp7CvimQf58vs7pxXHWe0irdqBcz7aDGkG5tm.TvImmquDR.CIG`
- Heslo: `admin123`
- SQL používa `ON CONFLICT`, takže je bezpečné spustiť viackrát

---

**Daj vedieť, čo ti ukázal SELECT query!** 🔍

