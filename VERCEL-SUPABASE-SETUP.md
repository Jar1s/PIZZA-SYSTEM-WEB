# 🚀 Vercel + Supabase Setup (Bez Fly.io!)

## ✅ Ano, můžete použít jen Vercel + Supabase!

### Architektura:
```
┌─────────────────┐
│  Vercel         │  ← Frontend (Next.js)
│                 │  ← Backend (NestJS jako serverless)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase       │  ← Databáze (PostgreSQL)
└─────────────────┘
```

**Náklady:**
- Vercel: Zdarma (Hobby) nebo $20/mes (Pro)
- Supabase: Zdarma (500 MB) nebo $25/mes (8 GB)
- **Celkem: 0 € (start) nebo ~€20-45/mes (produkce)**

---

## Krok 1: Supabase (Databáze)

### 1. Vytvořte projekt
1. Jděte na https://supabase.com
2. Přihlaste se / vytvořte účet
3. Klikněte "New Project"
4. Vyplňte:
   - **Name:** `pizza-ecosystem`
   - **Database Password:** (uložte si ho!)
   - **Region:** `West EU` (nebo nejbližší)

### 2. Získejte Connection String
1. V projektu: **Settings** → **Database**
2. Najděte **Connection string** → **URI**
3. Zkopírujte (vypadá takto):
   ```
   postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### 3. Spusťte migrace
```bash
cd backend
# Nastavte DATABASE_URL
export DATABASE_URL="postgresql://postgres:[VÁŠ_PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Spusťte migrace
npx prisma migrate deploy

# Seed data (vytvoří 2 brandy)
npx prisma db seed
```

---

## Krok 2: Backend na Vercel

### 1. Deploy backendu
```bash
cd backend
vercel login
vercel
```

Vercel se zeptá:
- **Set up and deploy?** → Y
- **Which scope?** → Vyberte účet
- **Link to existing project?** → N
- **What's your project's name?** → `pizza-ecosystem-api`
- **In which directory is your code located?** → `./`

### 2. Nastavte Environment Variables

V Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# Databáze
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Server
NODE_ENV="production"
PORT="3000"

# Security
JWT_SECRET="your-very-long-secret-key-min-32-chars"

# Adyen (Payment)
ADYEN_API_KEY="your_key"
ADYEN_MERCHANT_ACCOUNT="your_account"
ADYEN_ENVIRONMENT="TEST"  # nebo LIVE
ADYEN_HMAC_KEY="your_hmac"

# Wolt Drive
WOLT_API_KEY_PORNOPIZZA="your_wolt_key"
WOLT_API_KEY_PIZZAVNUDZI="your_wolt_key"
KITCHEN_PHONE="+421900000000"

# CORS (přidejte své domény)
CORS_ORIGIN="https://pornopizza.sk,https://pizzavnudzi.sk,https://your-frontend.vercel.app"
```

### 3. Production Deploy
```bash
vercel --prod
```

Backend bude na: `https://pizza-ecosystem-api.vercel.app`

---

## Krok 3: Frontend na Vercel

### 1. Deploy frontendu
```bash
cd frontend
vercel login  # (pokud ještě nejste přihlášeni)
vercel
```

### 2. Nastavte Environment Variables

V Vercel Dashboard → Frontend Project → Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_URL="https://pizza-ecosystem-api.vercel.app"
```

### 3. Production Deploy
```bash
vercel --prod
```

---

## Krok 4: Připojení domén

### Frontend domény (pornopizza.sk, atd.)
1. Vercel Dashboard → Frontend Project → Settings → Domains
2. Přidejte domény:
   - `pornopizza.sk`
   - `pizzavnudzi.sk`
   - `maydaypizza.sk`

3. V DNS nastavení domén:
   - **Type:** CNAME
   - **Name:** @ (nebo www)
   - **Value:** `cname.vercel-dns.com`

### Backend API subdomain (volitelné)
Pokud chcete `api.pornopizza.sk`:
1. Vercel Dashboard → Backend Project → Settings → Domains
2. Přidejte: `api.pornopizza.sk`
3. V DNS:
   - **Type:** CNAME
   - **Name:** api
   - **Value:** `cname.vercel-dns.com`

---

## Automatické Deployy

### Připojte GitHub
1. Vercel Dashboard → Project → Settings → Git
2. Připojte GitHub repository
3. Každý push do `main` = automatický deploy

---

## Výhody tohoto řešení

✅ **Jednoduché:** Všechno na Vercelu  
✅ **Zdarma start:** Vercel Hobby + Supabase Free  
✅ **Automatické deployy:** Push = deploy  
✅ **Globální CDN:** Rychlé načítání  
✅ **HTTPS zdarma:** Automaticky  
✅ **Multi-tenant ready:** Vhodné pro 10 webů  

---

## Limity (Free Tier)

### Vercel Hobby:
- 100 GB bandwidth/mes
- Serverless Functions: 100 GB-hours/mes
- Dostačující pro start

### Supabase Free:
- 500 MB databáze
- 2 GB bandwidth
- Dostačující pro start

---

## Upgrade (když poroste provoz)

### Vercel Pro ($20/mes):
- Neomezený bandwidth
- Rychlejší buildy
- Priority support

### Supabase Pro ($25/mes):
- 8 GB databáze
- 50 GB bandwidth
- Priority support

**Celkem: ~€45/mes pro produkci**

---

## Troubleshooting

### Backend nefunguje
- Zkontrolujte, že `DATABASE_URL` je správně nastavený
- Zkontrolujte logy v Vercel Dashboard → Deployments → Logs

### Migrace nefungují
```bash
# Spusťte lokálně s Supabase connection string
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy
```

### CORS chyby
- Přidejte frontend URL do `CORS_ORIGIN` v backend environment variables

---

## Hotovo! 🎉

Teď máte:
- ✅ Frontend na Vercel
- ✅ Backend na Vercel (serverless)
- ✅ Databáze na Supabase
- ✅ Všechno zdarma (pro start)

**URL:**
- Frontend: `https://pornopizza.sk`
- Backend API: `https://pizza-ecosystem-api.vercel.app/api`

