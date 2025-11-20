# 🚀 Rychlý Deploy - Vercel + Supabase

## Krok 1: Supabase (Databáze)

### 1. Vytvořte projekt
1. Jděte na https://supabase.com
2. Přihlaste se / vytvořte účet
3. Klikněte **"New Project"**
4. Vyplňte:
   - **Name:** `pizza-ecosystem`
   - **Database Password:** (vytvořte silné heslo a ULOŽTE SI HO!)
   - **Region:** `West EU (Ireland)` nebo nejbližší
5. Klikněte **"Create new project"** (trvá ~2 minuty)

### 2. Získejte Connection String
1. Po vytvoření: **Settings** (⚙️) → **Database**
2. Najděte **Connection string** → **URI**
3. Zkopírujte (vypadá takto):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
4. **ULOŽTE SI TO!** Budete to potřebovat.

---

## Krok 2: Spusťte Migrace

```bash
cd backend

# Nastavte DATABASE_URL
export DATABASE_URL="postgresql://postgres:[VÁŠ_PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Spusťte migrace (vytvoří tabulky)
npx prisma migrate deploy

# Seed data (vytvoří 2 brandy: PornoPizza, Pizza v Núdzi)
npx prisma db seed
```

**Ověření:**
- Pokud vše proběhlo, uvidíte: "✅ Seeded database"

---

## Krok 3: Backend na Vercel

### 1. Deploy
```bash
cd backend
vercel login  # (pokud ještě nejste přihlášeni)
vercel
```

**Odpovězte:**
- Set up and deploy? → **Y**
- Which scope? → **Vyberte svůj účet**
- Link to existing project? → **N**
- What's your project's name? → **pizza-ecosystem-api**
- In which directory? → **./**

### 2. Nastavte Environment Variables

V **Vercel Dashboard** → **pizza-ecosystem-api** → **Settings** → **Environment Variables**:

**Přidejte:**
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
NODE_ENV=production
PORT=3000
JWT_SECRET=your-very-long-secret-key-minimum-32-characters-long
CORS_ORIGIN=https://your-frontend.vercel.app,https://pornopizza.sk
```

**Pro testování (zatím):**
```bash
ADYEN_API_KEY=test_key
ADYEN_MERCHANT_ACCOUNT=TestMerchant
ADYEN_ENVIRONMENT=TEST
ADYEN_HMAC_KEY=test_hmac
WOLT_API_KEY_PORNOPIZZA=test_key
WOLT_API_KEY_PIZZAVNUDZI=test_key
KITCHEN_PHONE=+421900000000
```

### 3. Production Deploy
```bash
vercel --prod
```

**Backend URL:** `https://pizza-ecosystem-api.vercel.app`

---

## Krok 4: Frontend na Vercel

### 1. Deploy
```bash
cd frontend
vercel login  # (pokud ještě nejste přihlášeni)
vercel
```

**Odpovězte:**
- Set up and deploy? → **Y**
- Which scope? → **Vyberte svůj účet**
- Link to existing project? → **N**
- What's your project's name? → **pizza-ecosystem-frontend**
- In which directory? → **./**

### 2. Nastavte Environment Variables

V **Vercel Dashboard** → **pizza-ecosystem-frontend** → **Settings** → **Environment Variables**:

```bash
NEXT_PUBLIC_API_URL=https://pizza-ecosystem-api.vercel.app
```

### 3. Production Deploy
```bash
vercel --prod
```

**Frontend URL:** `https://pizza-ecosystem-frontend.vercel.app`

---

## Krok 5: Testování

### Backend Health Check
```bash
curl https://pizza-ecosystem-api.vercel.app/api/health
```

Mělo by vrátit: `{"status":"ok"}`

### Frontend
Otevřete: `https://pizza-ecosystem-frontend.vercel.app`

---

## Krok 6: Připojení Domén (volitelné)

### Frontend domény
1. Vercel Dashboard → **pizza-ecosystem-frontend** → **Settings** → **Domains**
2. Přidejte: `pornopizza.sk`, `pizzavnudzi.sk`
3. V DNS nastavení domén:
   - **Type:** CNAME
   - **Name:** @
   - **Value:** `cname.vercel-dns.com`

---

## ✅ Hotovo!

**Máte:**
- ✅ Databáze na Supabase
- ✅ Backend na Vercel
- ✅ Frontend na Vercel
- ✅ Vše zdarma (pro start)

**URL:**
- Frontend: `https://pizza-ecosystem-frontend.vercel.app`
- Backend: `https://pizza-ecosystem-api.vercel.app/api`

---

## Troubleshooting

### Backend nefunguje
- Zkontrolujte `DATABASE_URL` v environment variables
- Zkontrolujte logy: Vercel Dashboard → Deployments → Logs

### Migrace nefungují
```bash
# Spusťte lokálně s Supabase connection string
export DATABASE_URL="postgresql://..."
cd backend
npx prisma migrate deploy
```

### CORS chyby
- Přidejte frontend URL do `CORS_ORIGIN` v backend environment variables

