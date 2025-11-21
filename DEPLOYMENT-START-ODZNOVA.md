# 🚀 DEPLOYMENT - Začať Odznova (Jednoduchý Návod)

## ⚡ Čo Robiť Teraz (Krok za Krokom)

### ✅ Krok 1: Vyčistiť Duplicitné Složky (1 minúta)

V termináli:
```bash
cd "/Users/jaroslav/Documents/CODING/WEBY miro"
rm -rf backend/shared
rm -rf frontend/shared
```

**Prečo:** Duplicitné `shared` složky spôsobujú zmätok. Používame iba root `/shared/`.

---

### ✅ Krok 2: Commit Všetko do Gitu (2 minúty)

```bash
# Pridať všetky potrebné súbory
git add backend/.gitignore backend/package-lock.json
git add backend/vercel-build.sh
git add DEPLOYMENT-RESCUE-PLAN.md DEPLOYMENT-STATUS.md TEST-DEPLOYMENT.md
git add SUPABASE-CONNECTION*.md SUPABASE-TROUBLESHOOTING.md SUPABASE-PIZZA1.md
git add VERCEL-DEPLOYMENT-PROTECTION.md VERCEL-ENV-QUICK-SETUP.md VERCEL-ENV-VALUES.md
git add DEPLOYMENT-FIX-COMPLETE.md DEPLOYMENT-START-ODZNOVA.md

# Commit
git commit -m "fix: cleanup duplicate shared folders and add deployment docs"

# Push
git push origin main
```

---

### ✅ Krok 3: Vercel Dashboard - Environment Variables (3 minúty)

**Otvoriť:** https://vercel.com → Tvoj Projekt → **Settings** → **Environment Variables**

**Pridať/Nastaviť tieto 3 premenné:**

#### 1. DATABASE_URL
```
Key: DATABASE_URL
Value: postgresql://postgres.wfzppetogdcgcjvmrgt:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
Environment: ✅ Production, ✅ Preview
```

#### 2. JWT_SECRET
```bash
# Najprv vygenerovať v termináli:
openssl rand -base64 32
```

```
Key: JWT_SECRET
Value: [vložiť vygenerovanú hodnotu]
Environment: ✅ Production, ✅ Preview
```

#### 3. JWT_REFRESH_SECRET
```bash
# Vygenerovať druhú hodnotu:
openssl rand -base64 32
```

```
Key: JWT_REFRESH_SECRET
Value: [vložiť druhú vygenerovanú hodnotu]
Environment: ✅ Production, ✅ Preview
```

**Kliknúť:** **Save**

---

### ✅ Krok 4: Vypnúť Deployment Protection (1 minúta)

**Otvoriť:** Vercel Dashboard → Tvoj Projekt → **Settings** → **Deployment Protection**

**Nastaviť:**
- Deployment Protection = **OFF** alebo **Public**

**Prečo:** Deployment Protection blokuje OPTIONS requests (potrebné pre CORS).

**Kliknúť:** **Save**

---

### ✅ Krok 5: Vymazať Build Cache (1 minúta)

**Otvoriť:** Vercel Dashboard → Tvoj Projekt → **Settings** → **General**

**Scroll dole na:** **Build & Development Settings**

**Kliknúť:** **Clear Build Cache**

**Potvrdiť:** Vymazanie cache

---

### ✅ Krok 6: Redeploy Bez Cache (3 minúty)

**Otvoriť:** Vercel Dashboard → Tvoj Projekt → **Deployments**

**Kroky:**
1. Kliknúť **...** (tri bodky) u posledného deploymentu
2. Vybrať **Redeploy**
3. **DÔLEŽITÉ:** Odškrtnúť **"Use existing Build Cache"**
4. Kliknúť **Redeploy**
5. Počkať 2-3 minúty na dokončenie

---

### ✅ Krok 7: Testovať (1 minúta)

**Nájsť Backend URL:**
- Vercel Dashboard → **Deployments** → Kliknúť na posledný deployment
- URL je v hornej časti (napr.: `https://backend-xxx.vercel.app`)

**Testovať v termináli:**
```bash
# Health Check
curl https://your-backend.vercel.app/api/health

# Malo by vrátiť: {"status":"ok"} alebo 200 OK

# Test Tenant
curl https://your-backend.vercel.app/api/tenants/pornopizza

# Malo by vrátiť JSON s tenant dátami
```

---

## 🔍 Ak Stále Ne Funguje

### Problém: "Cannot find module 'zod'"
**Riešenie:**
1. Vercel Dashboard → Settings → General → **Clear Build Cache**
2. Redeploy bez cache

### Problém: "PrismaClientInitializationError"
**Riešenie:**
1. Skontrolovať, že `DATABASE_URL` je nastavené správne
2. Skontrolovať Build Logs - malo by byť vidieť `Generated Prisma Client`
3. Clear Build Cache a redeploy

### Problém: CORS Errors
**Riešenie:**
1. Vypnúť Deployment Protection
2. Skontrolovať Runtime Logs v Vercel Dashboard

### Problém: "FUNCTION_INVOCATION_FAILED"
**Riešenie:**
1. Vercel Dashboard → Deployments → Kliknúť na deployment → **Runtime Logs**
2. Hľadať error messages
3. Skontrolovať Build Logs

---

## ✅ Checklist

- [ ] Odstránené `backend/shared/` a `frontend/shared/`
- [ ] Všetky súbory pridané do gitu
- [ ] Commit a push
- [ ] `DATABASE_URL` nastavené na Vercelu
- [ ] `JWT_SECRET` nastavené na Vercelu
- [ ] `JWT_REFRESH_SECRET` nastavené na Vercelu
- [ ] Deployment Protection vypnuté
- [ ] Build Cache vymazané
- [ ] Redeploy bez cache
- [ ] `/api/health` funguje
- [ ] `/api/tenants/pornopizza` funguje

---

## 📝 Dôležité Poznámky

1. **Shared Module:** Používa sa iba root `/shared/` složka (nie `backend/shared/` ani `frontend/shared/`)

2. **Build Proces:** 
   - Automaticky kompiluje `/shared` do `backend/dist/shared/` počas buildu
   - Používa `npm run build`, ktorý zahrňuje `postbuild` script

3. **CORS:** 
   - Backend automaticky povoluje všetky `.vercel.app` origins
   - Deployment Protection musí byť vypnuté

4. **Database:** 
   - Potrebuje Supabase connection string v `DATABASE_URL`
   - Používa pooler connection (funguje pre serverless)

---

## 🎯 Zhrnutie

**Deployment NENÍ ztracený!** Všetko je pripravené:
- ✅ Build funguje lokálne
- ✅ Vercel konfigurácia (`vercel.json`) je správna
- ✅ API handler (`api/index.ts`) je správne nastavený

**Stačí spraviť týchto 7 krokov (celkovo ~10 minút):**
1. Vyčistiť duplicitné súbory
2. Commit a push
3. Nastaviť environment variables
4. Vypnúť Deployment Protection
5. Clear cache
6. Redeploy
7. Testovať

**Ak máš problémy, skontroluj Runtime Logs v Vercel Dashboard!**

