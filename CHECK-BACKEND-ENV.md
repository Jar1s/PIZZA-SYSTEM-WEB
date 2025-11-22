# 🔍 Kontrola Backend Environment Variables

## ❌ Problém: 500 Internal Server Error pri login

Účty sú vytvorené v databáze ✅, ale login stále vracia 500 error.

---

## 🔧 Možné Príčiny

### 1. Chýbajúce Environment Variables

Skontroluj v Render.com Dashboard, či sú nastavené všetky potrebné premenné:

**Povinné:**
- `DATABASE_URL` - Connection string k Supabase
- `JWT_SECRET` - Secret pre JWT tokeny
- `JWT_REFRESH_SECRET` - Secret pre refresh tokeny
- `NODE_ENV` - `production`

**Voliteľné (ale odporúčané):**
- `GOOGLE_CLIENT_ID` - Pre Google OAuth
- `GOOGLE_CLIENT_SECRET` - Pre Google OAuth
- `GOOGLE_REDIRECT_URI` - Pre Google OAuth
- `ALLOWED_ORIGINS` - CORS origins

---

## 📋 Krok 1: Skontroluj Environment Variables v Render.com

1. **Choď na:** https://dashboard.render.com
2. **Vyber backend service** (`pizza-ecosystem-api` alebo podobný)
3. **Klikni na "Environment"** (v ľavom menu)
4. **Skontroluj, či sú nastavené:**

```
DATABASE_URL=postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
JWT_SECRET=<nejaký-náhodný-string-min-32-znakov>
JWT_REFRESH_SECRET=<nejaký-iný-náhodný-string-min-32-znakov>
NODE_ENV=production
```

---

## 📋 Krok 2: Pozri sa na Backend Logy

1. **Choď na:** https://dashboard.render.com
2. **Vyber backend service**
3. **Klikni na "Logs"** (v ľavom menu)
4. **Skús sa prihlásiť** (https://pizza-system-web.vercel.app/login)
5. **Pozri sa na error v logoch**

Hľadaj:
- `PrismaClientInitializationError`
- `JWT_SECRET is not defined`
- `Cannot connect to database`
- `Error: ...`

---

## 🔧 Krok 3: Vygeneruj JWT Secrets (ak chýbajú)

Ak nemáš `JWT_SECRET` alebo `JWT_REFRESH_SECRET`, vygeneruj ich:

```bash
# V termináli:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Spusti 2x a získaj 2 rôzne secrets:
1. Prvý → `JWT_SECRET`
2. Druhý → `JWT_REFRESH_SECRET`

Potom ich pridaj do Render.com Environment Variables.

---

## 🧪 Krok 4: Test Database Connection

Spusti v Supabase SQL Editor:

```sql
-- Test, či backend vidí účty
SELECT id, username, role, "isActive"
FROM users
WHERE username = 'admin';
```

Ak to funguje, databáza je OK. Problém je pravdepodobne v backend kóde alebo env premenných.

---

## 📝 Najčastejšie Príčiny 500 Error

1. **Chýbajúci JWT_SECRET** → Backend nemôže generovať tokeny
2. **Nesprávny DATABASE_URL** → Backend sa nevie pripojiť k databáze
3. **Prisma Client nie je vygenerovaný** → Backend nevie používať Prisma
4. **Chyba v auth.service.ts** → Problém v kóde

---

**Daj vedieť, čo vidíš v backend logoch!** 🔍

