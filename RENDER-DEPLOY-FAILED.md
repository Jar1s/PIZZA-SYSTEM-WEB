# 🚨 Render.com Deployment Failed - Troubleshooting

## Problém:
```
Exited with status 1 while running your code
```

Deployment zlyháva pri spustení aplikácie.

## Možné Príčiny:

### 1. ❌ Chýbajúci `JWT_SECRET`
Aplikácia vyžaduje `JWT_SECRET` v production.

**Riešenie:**
1. **Render Dashboard** → **PIZZA-SYSTEM-WEB** → **Environment**
2. **Add Environment Variable:**
   - **Key**: `JWT_SECRET`
   - **Value**: `0ax6regUYrpZssgHfuL3WkSAnCWjDgNYx8B/MLuUyTA=`
3. **Save Changes**

### 2. ❌ Chýbajúci `DATABASE_URL`
Aplikácia vyžaduje `DATABASE_URL` pre databázové pripojenie.

**Riešenie:**
1. **Render Dashboard** → **PIZZA-SYSTEM-WEB** → **Environment**
2. **Add Environment Variable:**
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`
3. **Save Changes**

### 3. ❌ Databázové pripojenie zlyhá
Aj keď je `DATABASE_URL` nastavený, pripojenie môže zlyhať.

**Riešenie:**
- Skontroluj, či je connection string správny (Session Pooler - IPv4 kompatibilný)
- Skontroluj Supabase firewall (Settings → Database → Network Restrictions → Allow all IPs)
- Pozri `RENDER-DATABASE-FIX.md` pre detailné kroky

### 4. ❌ Chýbajúci `JWT_REFRESH_SECRET`
Aplikácia môže vyžadovať aj `JWT_REFRESH_SECRET`.

**Riešenie:**
1. **Render Dashboard** → **PIZZA-SYSTEM-WEB** → **Environment**
2. **Add Environment Variable:**
   - **Key**: `JWT_REFRESH_SECRET`
   - **Value**: (použi iný secret ako `JWT_SECRET`, alebo rovnaký ak nemáš)
3. **Save Changes**

---

## ✅ Checklist Environment Variables:

Skontroluj, či máš všetky tieto environment variables v Render.com:

- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `10000` (alebo nechaj Render automaticky nastaviť)
- [ ] `DATABASE_URL` = `postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`
- [ ] `JWT_SECRET` = `0ax6regUYrpZssgHfuL3WkSAnCWjDgNYx8B/MLuUyTA=`
- [ ] `JWT_REFRESH_SECRET` = (nastav ak je potrebný)

---

## 🔍 Ako Zistiť Presnú Chybu:

### Krok 1: Pozri sa na Deploy Logs

1. **Render Dashboard** → **PIZZA-SYSTEM-WEB**
2. **Klikni na "Deploy failed"** event
3. **Klikni na "deploy logs"** (fialový link)
4. **Skroluj na koniec** logov - tam je najnovšia chyba

### Krok 2: Hľadaj Tieto Chyby:

**Ak vidíš:**
```
❌ JWT_SECRET environment variable is required in production!
```
→ Pridaj `JWT_SECRET` environment variable

**Ak vidíš:**
```
❌ DATABASE_URL environment variable is not set!
```
→ Pridaj `DATABASE_URL` environment variable

**Ak vidíš:**
```
❌ Failed to connect to database
Can't reach database server at...
```
→ Skontroluj `DATABASE_URL` a Supabase firewall (pozri `RENDER-DATABASE-FIX.md`)

**Ak vidíš:**
```
Error: Cannot find module...
```
→ Problém s buildom - skontroluj build logy

---

## 🎯 Rýchle Riešenie:

1. **Render Dashboard** → **PIZZA-SYSTEM-WEB** → **Environment**
2. **Pridaj všetky environment variables** (pozri checklist vyššie)
3. **Save Changes**
4. **Render automaticky redeployuje**
5. **Skontroluj logy** - mala by sa zobraziť správa:
   ```
   ✅ Database connected successfully
   🚀 Backend server running on http://localhost:10000
   ```

---

## 📋 Po Nastavení Environment Variables:

Po pridaní všetkých environment variables:
- Render automaticky redeployuje
- Alebo manuálne: **Manual Deploy** → **Deploy latest commit**
- Skontroluj logy - aplikácia by sa mala úspešne spustiť

---

## 🔗 Súvisiace Dokumenty:

- `RENDER-DEPLOY.md` - Kompletný deployment guide
- `RENDER-DATABASE-FIX.md` - Oprava databázového pripojenia
- `RENDER-IPV4-FIX.md` - IPv4 kompatibilita s Supabase

