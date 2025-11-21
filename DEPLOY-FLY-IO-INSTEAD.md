# 🚀 Deploy na Fly.io Namiesto Vercelu (Odporúčané)

## Prečo Fly.io Namiesto Vercelu?

✅ **Výhody Fly.io:**
- ✅ **Žiadne problémy s Prisma** - Docker build funguje perfektne
- ✅ **Lepšie pre NestJS** - long-running procesy, nie serverless
- ✅ **Jednoduchšie nastavenie** - Dockerfile už máme
- ✅ **Lepšie pre backend API** - konzistentné prostredie
- ✅ **Automatické škálovanie** - auto-start/stop machines
- ✅ **Lacnejšie** - ~$5-10/mesiac vs Vercel Pro

❌ **Problémy s Vercelom:**
- ❌ Prisma Client cache problémy
- ❌ Serverless nie je ideálne pre NestJS
- ❌ Komplikované build procesy
- ❌ Drahšie pre produkciu

---

## 🚀 Rýchle Nasadenie na Fly.io (10 minút)

### Krok 1: Inštalovať Fly CLI

```bash
# macOS
curl -L https://fly.io/install.sh | sh

# Alebo cez Homebrew
brew install flyctl

# Login
fly auth login
```

### Krok 2: Vytvoriť App (Ak Ešte Nie Je)

```bash
cd backend

# Ak už máš app, preskoč tento krok
fly launch
# Vyber:
# - App name: pizza-ecosystem-api (alebo tvoj názov)
# - Region: ams (Amsterdam - blízko SK)
# - Postgres: No (použijeme Supabase)
# - Redis: No (voliteľné)
```

### Krok 3: Nastaviť Secrets (Environment Variables)

```bash
cd backend

# Database URL (tvoj Supabase)
fly secrets set DATABASE_URL="postgresql://postgres.wfzppetogdcgcjvmrgt:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

# JWT Secrets
fly secrets set JWT_SECRET="0ax6regUYrpZssgHfuL3WkSAnCWjDgNYx8B/MLuUyTA="
fly secrets set JWT_REFRESH_SECRET="l6lvL9RLeSSXi8CjuEHzElIxzh03lLVpEaBkFuprD64="

# Node Environment
fly secrets set NODE_ENV="production"

# Skontrolovať secrets
fly secrets list
```

### Krok 4: Deploy!

```bash
cd backend
fly deploy
```

**To je všetko!** 🎉

Po 2-3 minútach bude backend dostupný na:
```
https://pizza-ecosystem-api.fly.dev
```

### Krok 5: Testovať

```bash
# Health check
curl https://pizza-ecosystem-api.fly.dev/api/health

# Test tenant
curl https://pizza-ecosystem-api.fly.dev/api/tenants/pornopizza
```

---

## 📋 Čo Sa Stane Počas Deploy

1. **Fly.io build Docker image** z `Dockerfile`
2. **Spustí `npm ci`** - inštaluje dependencies
3. **Spustí `npx prisma generate`** - generuje Prisma Client ✅
4. **Spustí `npm run build`** - kompiluje backend
5. **Spustí aplikáciu** - `npm run start:prod`
6. **Health checks** - automaticky kontroluje, či app beží

**Žiadne problémy s Prisma Client!** Docker build to rieši automaticky.

---

## 🔧 Ak Potrebuješ Upraviť Konfiguráciu

### Zmeniť Region
```bash
fly regions set ams  # Amsterdam (blízko SK)
```

### Zobraziť Logs
```bash
fly logs
```

### SSH do App
```bash
fly ssh console
```

### Zobraziť Status
```bash
fly status
```

### Restart App
```bash
fly apps restart pizza-ecosystem-api
```

---

## 💰 Ceny

**Fly.io Free Tier:**
- 3 shared-cpu VMs
- 3GB storage
- 160GB outbound data transfer
- **Dostatočné pre začiatok!**

**Ak potrebuješ viac:**
- Shared CPU: ~$1.94/mesiac za VM
- Dedicated CPU: ~$5.70/mesiac za VM

**Odporúčanie:** Začni s free tier, potom škáluj podľa potreby.

---

## 🔄 Automatické Deployments

### GitHub Actions (Voliteľné)

Vytvor `.github/workflows/deploy-fly.yml`:

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        working-directory: ./backend
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

**GitHub Secret:**
- `FLY_API_TOKEN` - získaj z: `fly auth token`

---

## ✅ Výhody oproti Vercelu

| Feature | Vercel | Fly.io |
|---------|--------|--------|
| Prisma Support | ❌ Problémy s cache | ✅ Funguje perfektne |
| NestJS Support | ⚠️ Serverless limity | ✅ Plná podpora |
| Docker | ❌ Nie | ✅ Áno |
| Build Time | ⚠️ Cache problémy | ✅ Konzistentné |
| Cena | 💰 Drahšie | 💰 Lacnejšie |
| Setup | ⚠️ Komplikované | ✅ Jednoduché |

---

## 🎯 Zhrnutie

**Namiesto bojovania s Vercelom:**

1. ✅ Inštaluj Fly CLI (2 min)
2. ✅ Nastav secrets (2 min)
3. ✅ `fly deploy` (3 min)
4. ✅ Hotovo! 🎉

**Celkový čas:** ~10 minút vs hodiny debugovania Vercelu

**Odporúčanie:** Prejdi na Fly.io. Je to jednoduchšie, rýchlejšie a funguje to hneď.

---

## 📝 Poznámky

- **Frontend** môže zostať na Verceli (je tam v poriadku)
- **Backend** na Fly.io (lepšie pre API)
- **Database** na Supabase (už máš)
- **CORS:** Upraviť `ALLOWED_ORIGINS` v backend kóde, aby obsahoval Fly.io URL

---

## 🔗 Užitočné Linky

- Fly.io Dashboard: https://fly.io/dashboard
- Fly.io Docs: https://fly.io/docs
- Tvoj App: https://fly.io/apps/pizza-ecosystem-api

