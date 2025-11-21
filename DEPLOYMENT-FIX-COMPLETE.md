# 🚀 DEPLOYMENT FIX - Kompletní Návod

## ⚡ Rýchle Riešenie (5 minút)

### Krok 1: Vyčistiť Duplicitné Složky
```bash
# Odstrániť duplicitné shared složky
rm -rf backend/shared
rm -rf frontend/shared
```

### Krok 2: Commit Všetko do Gitu
```bash
# Pridať všetky potrebné súbory
git add backend/.gitignore backend/package-lock.json
git add backend/vercel-build.sh
git add DEPLOYMENT-RESCUE-PLAN.md DEPLOYMENT-STATUS.md TEST-DEPLOYMENT.md
git add SUPABASE-CONNECTION*.md SUPABASE-TROUBLESHOOTING.md SUPABASE-PIZZA1.md
git add VERCEL-DEPLOYMENT-PROTECTION.md VERCEL-ENV-QUICK-SETUP.md VERCEL-ENV-VALUES.md

# Commit
git commit -m "fix: cleanup duplicate shared folders and add deployment docs"

# Push
git push origin main
```

### Krok 3: Vercel Dashboard - Environment Variables

**Otvoriť:** Vercel Dashboard → Tvoj Projekt → Settings → Environment Variables

**Pridať/Nastaviť:**
1. `DATABASE_URL` = `postgresql://postgres.wfzppetogdcgcjvmrgt:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`
   - Environment: ✅ Production, ✅ Preview
   
2. `JWT_SECRET` = (vygenerovať: `openssl rand -base64 32`)
   - Environment: ✅ Production, ✅ Preview
   
3. `JWT_REFRESH_SECRET` = (vygenerovať: `openssl rand -base64 32`)
   - Environment: ✅ Production, ✅ Preview

4. `ALLOWED_ORIGINS` = (voliteľné - `.vercel.app` origins sú povolené automaticky)
   - Environment: ✅ Production, ✅ Preview

**Kliknúť:** Save

### Krok 4: Vypnúť Deployment Protection

**Otvoriť:** Vercel Dashboard → Tvoj Projekt → Settings → Deployment Protection

**Nastaviť:** 
- Deployment Protection = **OFF** alebo **Public**
- (Toto blokuje OPTIONS requests, ktoré sú potrebné pre CORS)

**Kliknúť:** Save

### Krok 5: Vymazať Build Cache a Redeploy

**Otvoriť:** Vercel Dashboard → Tvoj Projekt → Settings → General

**Scroll dole na:** Build & Development Settings

**Kliknúť:** **Clear Build Cache**

**Potom:**
1. Vercel Dashboard → Deployments
2. Kliknúť **...** (tri bodky) u posledného deploymentu
3. Vybrať **Redeploy**
4. **DÔLEŽITÉ:** Odškrtnúť **"Use existing Build Cache"**
5. Kliknúť **Redeploy**
6. Počkať 2-3 minúty

### Krok 6: Testovať

Po dokončení deploymentu:

```bash
# Nájdi backend URL v Vercel Dashboard → Deployments
# Môže byť napr.: https://backend-xxx.vercel.app

# Test Health Check
curl https://your-backend.vercel.app/api/health

# Test Tenant
curl https://your-backend.vercel.app/api/tenants/pornopizza
```

**Očakávané výsledky:**
- ✅ `/api/health` → `{"status":"ok"}` alebo `200 OK`
- ✅ `/api/tenants/pornopizza` → JSON s tenant dátami

---

## 🔍 Ak Stále Ne Funguje

### Problém 1: "Cannot find module 'zod'"
**Riešenie:**
1. Vercel Dashboard → Settings → General → **Clear Build Cache**
2. Redeploy bez cache

### Problém 2: "PrismaClientInitializationError"
**Riešenie:**
1. Skontrolovať, že `DATABASE_URL` je nastavené v Environment Variables
2. Skontrolovať Build Logs - malo by byť vidieť `Generated Prisma Client`
3. Clear Build Cache a redeploy

### Problém 3: CORS Errors
**Riešenie:**
1. Vypnúť Deployment Protection
2. Skontrolovať Runtime Logs v Vercel Dashboard

### Problém 4: "FUNCTION_INVOCATION_FAILED"
**Riešenie:**
1. Vercel Dashboard → Deployments → Runtime Logs
2. Hľadať error messages
3. Skontrolovať, že `api/index.ts` je správne nastavený

---

## ✅ Deployment Checklist

- [ ] Odstránené `backend/shared/` a `frontend/shared/`
- [ ] Všetky súbory pridané do gitu
- [ ] Commit a push
- [ ] `DATABASE_URL` nastavené na Vercelu
- [ ] `JWT_SECRET` a `JWT_REFRESH_SECRET` nastavené
- [ ] Deployment Protection vypnuté
- [ ] Build Cache vymazané
- [ ] Redeploy bez cache
- [ ] `/api/health` funguje
- [ ] `/api/tenants/pornopizza` funguje

---

## 📝 Poznámky

- **Shared Module:** Používa sa iba root `/shared/` složka
- **Build:** Automaticky kompiluje `/shared` do `backend/dist/shared/` počas buildu
- **CORS:** Backend automaticky povoluje všetky `.vercel.app` origins
- **Database:** Potrebuje Supabase connection string v `DATABASE_URL`

---

## 🎯 Zhrnutie

**Deployment NENÍ ztracený!** Všetko je pripravené:
- ✅ Build funguje lokálne
- ✅ Vercel konfigurácia je správna
- ✅ API handler je správne nastavený

**Stačí:**
1. Vyčistiť duplicitné súbory (2 min)
2. Commit a push (1 min)
3. Nastaviť environment variables na Vercelu (2 min)
4. Vypnúť Deployment Protection (1 min)
5. Clear cache a redeploy (3 min)
6. Testovať (1 min)

**Celkový čas:** ~10 minút

