# 🔧 Oprava Databázového Pripojenia na Render.com

## Problém:
```
Can't reach database server at `db.gsawehudurchkeysdqhm.supabase.co:5432`
```

## Riešenie:

### Krok 1: Skontrolovať DATABASE_URL v Render.com

1. **Choď do Render Dashboard**: https://dashboard.render.com
2. **Vyber tvoju službu**: `PIZZA-SYSTEM-WEB`
3. **Klikni na "Environment"** (v ľavom menu)
4. **Skontroluj, či existuje `DATABASE_URL`**:
   - Ak **NIE**, pridaj ho (pozri Krok 2)
   - Ak **ÁNO**, skontroluj hodnotu (pozri Krok 3)

### Krok 2: Pridať DATABASE_URL (ak neexistuje)

1. **Klikni na "Add Environment Variable"**
2. **Key**: `DATABASE_URL`
3. **Value**: `postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres` (Session Pooler - IPv4 kompatibilný)
4. **Save Changes**

### Krok 3: Overiť DATABASE_URL hodnotu

**Správny formát (Session Pooler - IPv4 kompatibilný):**
```
postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

**⚠️ Dôležité:** Použi Session Pooler namiesto priameho connection stringu, pretože Render.com používa IPv4 a priamy connection string nie je IPv4 kompatibilný!

**Časti connection stringu:**
- `postgresql://` - protokol
- `postgres` - používateľ
- `011jarko` - heslo
- `db.gsawehudurchkeysdqhm.supabase.co` - host
- `5432` - port
- `postgres` - databáza

### Krok 4: Skúsiť Pooler Connection String (ak priamy nefunguje)

Ak priamy connection string nefunguje, skús **pooler** verziu:

**Pooler Connection String:**
```
postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

**Rozdiel:**
- Host: `aws-1-eu-west-1.pooler.supabase.com` (namiesto `db.gsawehudurchkeysdqhm.supabase.co`)
- Port: `5432` (rovnaký ako priamy, ale cez pooler)
- User: `postgres.gsawehudurchkeysdqhm` (namiesto `postgres`)
- ✅ **IPv4 kompatibilný** (Session pooler je IPv4 proxied)

### Krok 5: Skontrolovať Supabase Firewall

1. **Choď do Supabase Dashboard**: https://supabase.com/dashboard/project/gsawehudurchkeysdqhm
2. **Settings** → **Database**
3. **Nájdi "Network Restrictions"** alebo "Connection Pooling"
4. **Povol pripojenia z Render.com**:
   - Buď nastav "Allow all IPs" (na testovanie)
   - Alebo pridaj Render.com IP ranges

### Krok 6: Redeploy po zmene

Po zmene `DATABASE_URL`:
1. **Render automaticky redeployuje** (ak máš auto-deploy)
2. **Alebo manuálne**: Klikni na "Manual Deploy" → "Deploy latest commit"

---

## Testovanie Pripojenia:

Po redeployi skontroluj logy. Mala by sa zobraziť správa:
```
✅ Connected to database successfully
```

Namiesto:
```
❌ Failed to connect to database
```

---

## Alternatíva: Použiť Supabase Connection Pooler

Supabase Connection Pooler je odporúčaný pre produkciu:

1. **V Supabase Dashboard** → **Settings** → **Database**
2. **Nájdi "Connection Pooling"**
3. **Skopíruj "Connection string"** (Session mode alebo Transaction mode)
4. **Použi ho v Render.com** ako `DATABASE_URL`

---

## Troubleshooting:

### Chyba: "Can't reach database server"
- ✅ Skontroluj, či je `DATABASE_URL` nastavený
- ✅ Over formát connection stringu
- ✅ Skontroluj Supabase firewall
- ✅ Skús pooler connection string

### Chyba: "FATAL: password authentication failed"
- ✅ Over heslo v connection stringu
- ✅ Skontroluj, či je heslo správne: `011jarko`

### Chyba: "FATAL: database does not exist"
- ✅ Over názov databázy (zvyčajne `postgres`)
- ✅ Skontroluj, či databáza existuje v Supabase

---

## Aktuálny Status:

✅ Build úspešný
✅ Aplikácia sa spustila
✅ Všetky routes sa načítali
❌ Databázové pripojenie zlyhá

**Ďalší krok:** Nastaviť správny `DATABASE_URL` v Render.com

