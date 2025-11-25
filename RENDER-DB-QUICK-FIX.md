# 🚨 Rýchla Oprava: Databázové Pripojenie na Render.com

## Problém:
```
Can't reach database server at `db.gsawehudurchkeysdqhm.supabase.co:5432`
```

## ✅ Riešenie Krok za Krokom:

### Krok 1: Overiť DATABASE_URL v Render.com

1. **Render Dashboard** → **PIZZA-SYSTEM-WEB** → **Environment**
2. **Skontroluj, či existuje `DATABASE_URL`**
3. **Ak NIE existuje**, pridaj ho (pozri Krok 2)
4. **Ak ÁNO existuje**, over hodnotu (pozri Krok 3)

### Krok 2: Pridať DATABASE_URL

**Presná hodnota:**
```
postgresql://postgres:011jarko@db.gsawehudurchkeysdqhm.supabase.co:5432/postgres
```

**Postup:**
1. Klikni "Add Environment Variable"
2. **Key**: `DATABASE_URL`
3. **Value**: Skopíruj hodnotu vyššie
4. **Save Changes**

### Krok 3: Skontrolovať Supabase Firewall

**Problém:** Supabase môže blokovať pripojenia z Render.com IP adries.

**Riešenie:**

1. **Supabase Dashboard**: https://supabase.com/dashboard/project/gsawehudurchkeysdqhm
2. **Settings** → **Database**
3. **Nájdi "Network Restrictions"** alebo "Connection Pooling"
4. **Povol pripojenia:**
   - Buď nastav **"Allow all IPs"** (na testovanie)
   - Alebo pridaj Render.com IP ranges

### Krok 4: Skúsiť Pooler Connection String

Ak priamy connection string nefunguje, skús **pooler** verziu:

**Pooler Connection String:**
```
postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

**Ako získať pooler string:**
1. **Supabase Dashboard** → **Settings** → **Database**
2. **Connection Pooling** → **Session mode** alebo **Transaction mode**
3. **Skopíruj connection string**
4. **Nahraď heslo**: `[YOUR-PASSWORD]` → `011jarko`

### Krok 5: Redeploy

Po zmene `DATABASE_URL`:
1. Render automaticky redeployuje (ak máš auto-deploy)
2. **Alebo manuálne**: "Manual Deploy" → "Deploy latest commit"

---

## 🔍 Diagnostika:

### Test 1: Overiť, či je databáza prístupná

Skús pripojiť sa z lokálneho počítača:
```bash
psql "postgresql://postgres:011jarko@db.gsawehudurchkeysdqhm.supabase.co:5432/postgres"
```

Ak to funguje lokálne, problém je v Supabase firewall.

### Test 2: Skontrolovať Render.com IP

Render.com používa dynamické IP adresy. Supabase môže blokovať neznáme IP adresy.

**Riešenie:** Povol "Allow all IPs" v Supabase (aspoň na testovanie).

---

## 📋 Checklist:

- [ ] `DATABASE_URL` je nastavený v Render.com
- [ ] Connection string má správny formát
- [ ] Heslo je správne: `011jarko`
- [ ] Supabase firewall povoluje pripojenia
- [ ] Redeploy po zmene environment variables

---

## 🎯 Najrýchlejšie Riešenie:

1. **Render.com** → **Environment** → Pridaj `DATABASE_URL`
2. **Supabase** → **Settings** → **Database** → Povol "Allow all IPs"
3. **Redeploy** v Render.com

Po týchto krokoch by malo pripojenie fungovať! 🚀


