# 🚨 Deployment Rescue Plan

## Aktuální Situace

✅ **Co funguje:**
- Backend build prochází lokálně
- Vercel konfigurace (`vercel.json`) je správně nastavená
- API handler (`api/index.ts`) má správnou CORS konfiguraci
- Build proces zahrnuje shared module kompilaci

⚠️ **Problémy:**
- Duplicitní `shared` složky (`backend/shared`, `frontend/shared`)
- Untracked Supabase dokumenty
- Možná chybí environment variables na Vercelu
- Deployment Protection může blokovat požadavky

---

## 🔧 Krok 1: Vyčistit Duplicitní Složky

Duplicitní `shared` složky způsobují zmatek. Měli bychom používat pouze root `/shared`.

**Smazat:**
- `backend/shared/` (duplikát)
- `frontend/shared/` (duplikát)

**Zachovat:**
- `/shared/` (root shared modul)

---

## 🔧 Krok 2: Přidat Potřebné Soubory do Gitu

**Potřebné soubory pro deployment:**
```bash
# Vercel build script (pokud se používá)
git add backend/vercel-build.sh

# Supabase dokumenty (pro referenci)
git add SUPABASE-CONNECTION*.md SUPABASE-TROUBLESHOOTING.md SUPABASE-PIZZA1.md
git add VERCEL-DEPLOYMENT-PROTECTION.md
```

**NEPŘIDÁVAT:**
- `backend/shared/` - duplikát
- `frontend/shared/` - duplikát

---

## 🔧 Krok 3: Ověřit Vercel Konfiguraci

**Současná `vercel.json`:**
```json
{
  "version": 2,
  "buildCommand": "npm run prisma:generate && npm run build",
  "installCommand": "npm ci --include=dev && npx prisma generate",
  "outputDirectory": "dist",
  "framework": null,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

✅ **Vypadá dobře!** Build command zahrnuje:
- `prisma:generate` - generuje Prisma Client
- `build` - kompiluje backend + shared module

---

## 🔧 Krok 4: Zkontrolovat Environment Variables na Vercelu

**Potřebné proměnné:**
1. `DATABASE_URL` - Supabase connection string
2. `NODE_ENV=production` (nastaveno v vercel.json)
3. `ALLOWED_ORIGINS` (volitelné - `.vercel.app` origins jsou povoleny automaticky)

**Jak zkontrolovat:**
1. Vercel Dashboard → Projekt → Settings → Environment Variables
2. Ověřit, že `DATABASE_URL` je nastaveno

---

## 🔧 Krok 5: Vypnout Deployment Protection (Pokud Blokuje)

**Problém:** Deployment Protection blokuje OPTIONS preflight požadavky před tím, než se dostanou k NestJS aplikaci.

**Řešení:**
1. Vercel Dashboard → Projekt → Settings → Deployment Protection
2. Vypnout **Deployment Protection** nebo nastavit na **Public**

**Alternativa:** Použít Protection Bypass Token (méně doporučeno)

---

## 🚀 Krok 6: Deploy na Vercel

### Možnost A: Via Git Push (Doporučeno)
```bash
# 1. Commit změny
git add backend/vercel.json backend/vercel-build.sh
git add SUPABASE-CONNECTION*.md VERCEL-DEPLOYMENT-PROTECTION.md
git commit -m "fix: cleanup deployment config and add docs"

# 2. Push
git push origin main
```

### Možnost B: Via Vercel CLI
```bash
cd backend
vercel --prod
```

### Možnost C: Via Vercel Dashboard
1. Otevřít projekt na Vercelu
2. Kliknout **Redeploy** (nebo počkat na auto-deploy z gitu)

---

## 🧪 Krok 7: Testovat Deployment

**Po deploymentu:**

1. **Health Check:**
```bash
curl https://your-backend.vercel.app/api/health
```

2. **Tenant Endpoint:**
```bash
curl https://your-backend.vercel.app/api/tenants/pornopizza
```

3. **CORS Test:**
```bash
curl -X OPTIONS https://your-backend.vercel.app/api/tenants \
  -H "Origin: https://your-frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

**Očekávané výsledky:**
- ✅ `/api/health` → `200 OK`
- ✅ `/api/tenants/pornopizza` → JSON s tenant daty
- ✅ OPTIONS request → CORS hlavičky v odpovědi

---

## 🔍 Troubleshooting

### Problém: "Cannot find module 'zod'"
**Řešení:**
1. Vercel Dashboard → Settings → General → **Clear Build Cache**
2. Redeploy bez cache (odškrtnout "Use existing Build Cache")

### Problém: "PrismaClientInitializationError"
**Řešení:**
1. Ověřit, že `DATABASE_URL` je nastaveno v Environment Variables
2. Ověřit, že build log obsahuje `Generated Prisma Client`
3. Clear Build Cache a redeploy

### Problém: CORS Errors
**Řešení:**
1. Vypnout Deployment Protection
2. Ověřit, že frontend URL je v `ALLOWED_ORIGINS` (nebo použít `.vercel.app` auto-allow)

### Problém: "FUNCTION_INVOCATION_FAILED"
**Řešení:**
1. Zkontrolovat Runtime Logs v Vercel Dashboard
2. Ověřit, že `api/index.ts` má správný error handling
3. Zkontrolovat, že shared module je zkompilován v `dist/shared/`

---

## ✅ Deployment Checklist

- [ ] Smazat duplicitní `backend/shared/` a `frontend/shared/`
- [ ] Přidat potřebné soubory do gitu
- [ ] Commit a push změny
- [ ] Ověřit Environment Variables na Vercelu (`DATABASE_URL`)
- [ ] Vypnout Deployment Protection (pokud blokuje)
- [ ] Clear Build Cache na Vercelu
- [ ] Deploy (git push nebo manuálně)
- [ ] Testovat `/api/health` endpoint
- [ ] Testovat `/api/tenants/pornopizza` endpoint
- [ ] Testovat CORS s OPTIONS requestem
- [ ] Zkontrolovat Runtime Logs pro chyby

---

## 📝 Poznámky

- **Shared Module:** Build proces automaticky kompiluje `/shared` do `backend/dist/shared/` během buildu
- **Vercel Build:** Používá `npm run build`, který zahrnuje `postbuild` script pro shared module
- **CORS:** Backend automaticky povoluje všechny `.vercel.app` origins
- **Database:** Potřebuje Supabase connection string v `DATABASE_URL`

---

## 🎯 Závěr

Deployment **NENÍ ztracený!** Všechno je připravené:
- ✅ Build funguje lokálně
- ✅ Vercel konfigurace je správná
- ✅ API handler je správně nastavený

Stačí:
1. Vyčistit duplicitní soubory
2. Commit a push
3. Ověřit environment variables
4. Vypnout Deployment Protection
5. Deploy a testovat

**Odhadovaný čas:** 15-20 minut

