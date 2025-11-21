# 🚀 Rychlé Nastavení Environment Variables na Vercelu

## ⚠️ Důležité: Project-Level vs Shared-Level

Na screenshotu vidím, že jsi na stránce **Shared Environment Variables** (Team level). 

**Pro backend deployment potřebuješ přidat variables na PROJECT level, ne Shared level!**

---

## 📍 Krok 1: Přejít na Project-Level Variables

1. V **Vercel Dashboard**:
   - Otevři svůj **backend projekt** (ne Team settings)
   - Jdi na **Settings** → **Environment Variables**
   - **NEPOUŽÍVEJ** "Shared Environment Variables" - ty jsou pro celý tým

2. Nebo přímo:
   - Klikni na název projektu v seznamu
   - Settings → Environment Variables

---

## 📋 Krok 2: Přidat Požadované Variables

### 🔴 POVINNÉ (Musí být nastaveno):

#### 1. DATABASE_URL
```
Key: DATABASE_URL
Value: postgresql://postgres:[PASSWORD]@db.nrhrncokptwuxlgkadxu.supabase.co:5432/postgres
Environment: ✅ Production, ✅ Preview, ❌ Development (volitelné)
```

**Jak získat:**
- Jdi na: https://supabase.com/dashboard/project/nrhrncokptwuxlgkadxu
- Settings → Database → Connection string → URI
- Nahraď `[PASSWORD]` skutečným heslem

#### 2. JWT_SECRET
```
Key: JWT_SECRET
Value: [generuj náhodný string]
Environment: ✅ Production, ✅ Preview
```

**Jak vygenerovat:**
```bash
openssl rand -base64 32
```

#### 3. JWT_REFRESH_SECRET
```
Key: JWT_REFRESH_SECRET
Value: [generuj jiný náhodný string]
Environment: ✅ Production, ✅ Preview
```

**Jak vygenerovat:**
```bash
openssl rand -base64 32
```

### 🟡 VOLITELNÉ (Doporučeno):

#### 4. ALLOWED_ORIGINS
```
Key: ALLOWED_ORIGINS
Value: https://your-frontend.vercel.app,https://pornopizza.sk
Environment: ✅ Production, ✅ Preview
```

**Poznámka:** Pokud nepřidáš, backend automaticky povolí všechny `.vercel.app` origins.

#### 5. SENTRY_DSN (pokud používáš Sentry)
```
Key: SENTRY_DSN
Value: https://xxx@xxx.ingest.sentry.io/xxx
Environment: ✅ Production, ✅ Preview
```

---

## 🎯 Krok 3: Jak Přidat Variable

1. **V Project Settings → Environment Variables:**
   - Klikni na **"Add New"** nebo **"Add Another"**
   - Vyplň **Key** (např. `DATABASE_URL`)
   - Vyplň **Value** (connection string nebo secret)
   - Vyber **Environments**:
     - ✅ **Production** (pro produkci)
     - ✅ **Preview** (pro preview deployments)
     - ❌ **Development** (volitelné, pro local dev)
   - Klikni **Save**

2. **Pro každou variable zopakuj krok 1**

---

## ✅ Krok 4: Ověřit a Redeploy

Po přidání všech variables:

1. **Zkontroluj seznam:**
   - Měly by být vidět všechny 3 povinné variables
   - Každá by měla mít zaškrtnuté Production a Preview

2. **Redeploy projekt:**
   - Jdi na **Deployments**
   - Klikni **...** (tři tečky) u posledního deploymentu
   - Vyber **Redeploy**
   - **DŮLEŽITÉ:** Odškrtni **"Use existing Build Cache"**
   - Klikni **Redeploy**

3. **Počkej na dokončení buildu** (~2-3 minuty)

---

## 🧪 Krok 5: Testovat

Po redeployi otestuj:

```bash
# Health check
curl https://your-backend.vercel.app/api/health

# Mělo by vrátit: {"status":"ok"} nebo 200 OK
```

**Pokud vidíš `PrismaClientInitializationError`:**
- Zkontroluj, že `DATABASE_URL` je správně nastaveno
- Zkontroluj, že connection string má správné heslo
- Zkontroluj Runtime Logs v Vercel Dashboard

---

## 🔍 Troubleshooting

### Problém: "Sensitive environment variables cannot be created in Development"
**Řešení:** 
- Nezaškrtávej **Development** environment pro sensitive variables (DATABASE_URL, JWT_SECRET)
- Použij pouze **Production** a **Preview**

### Problém: Variables se neprojevují po redeployi
**Řešení:**
1. Zkontroluj, že variables jsou přidané na **Project level**, ne Shared
2. Zkontroluj, že máš zaškrtnuté správné environments (Production/Preview)
3. Clear Build Cache a redeploy
4. Počkej 2-3 minuty po redeployi

### Problém: "Cannot find module 'zod'" nebo jiné build errors
**Řešení:**
1. Clear Build Cache (Settings → General → Clear Build Cache)
2. Redeploy bez cache
3. Zkontroluj Build Logs

---

## 📝 Checklist

- [ ] Otevřel jsem **Project Settings** (ne Team Settings)
- [ ] Přidal jsem `DATABASE_URL` s Supabase connection stringem
- [ ] Vygeneroval jsem a přidal `JWT_SECRET`
- [ ] Vygeneroval jsem a přidal `JWT_REFRESH_SECRET`
- [ ] Zaškrtl jsem **Production** a **Preview** pro všechny variables
- [ ] Klikl jsem **Save** pro každou variable
- [ ] Redeploy projekt bez cache
- [ ] Otestoval jsem `/api/health` endpoint

---

## 🎯 Rychlý Start

**Minimální setup (3 variables):**
1. `DATABASE_URL` - Supabase connection string
2. `JWT_SECRET` - `openssl rand -base64 32`
3. `JWT_REFRESH_SECRET` - `openssl rand -base64 32`

**To stačí pro základní deployment!** Ostatní variables jsou volitelné.

---

## 💡 Tip

Pokud máš Supabase connection string připravený, můžeš ho vložit přímo. Pokud ne, viz `SUPABASE-CONNECTION.md` pro návod, jak ho získat.

