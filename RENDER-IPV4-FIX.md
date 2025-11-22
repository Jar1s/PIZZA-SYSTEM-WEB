# 🔧 Oprava: IPv4 Kompatibilita s Supabase

## Problém:
```
Can't reach database server at `db.gsawehudurchkeysdqhm.supabase.co:5432`
```

**Príčina:** Supabase priamy connection string **nie je IPv4 kompatibilný**, ale Render.com (a Fly.io) používajú IPv4.

## ✅ Riešenie: Použiť Session Pooler

### Krok 1: Získať Session Pooler Connection String

1. **Supabase Dashboard** → **Settings** → **Database**
2. **Connection Pooling** → **Session mode**
3. **Skopíruj connection string** - vyzerá takto:
   ```
   postgresql://postgres.gsawehudurchkeysdqhm:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
   ```

### Krok 2: Nahradiť heslo

V skopírovanom connection stringu:
- Nahraď `[YOUR-PASSWORD]` → `011jarko`

**Výsledný connection string:**
```
postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

### Krok 3: Nastaviť v Render.com

1. **Render Dashboard** → **PIZZA-SYSTEM-WEB** → **Environment**
2. **Add/Edit Environment Variable:**
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`
3. **Save Changes**

### Krok 4: Redeploy

Po zmene `DATABASE_URL`:
- Render automaticky redeployuje
- Alebo manuálne: **Manual Deploy** → **Deploy latest commit**

---

## Rozdiel medzi priamym a pooler connection stringom:

### Priamy (NEFUNGUJE na IPv4):
```
postgresql://postgres:011jarko@db.gsawehudurchkeysdqhm.supabase.co:5432/postgres
```
- Host: `db.gsawehudurchkeysdqhm.supabase.co`
- Port: `5432`
- User: `postgres`
- ❌ Nie je IPv4 kompatibilný

### Session Pooler (FUNGUJE na IPv4):
```
postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```
- Host: `aws-1-eu-west-1.pooler.supabase.com`
- Port: `5432`
- User: `postgres.gsawehudurchkeysdqhm`
- ✅ IPv4 kompatibilný

---

## Prečo to nefungovalo na Fly.io ani Render.com:

- Obe platformy používajú **IPv4**
- Supabase priamy connection string je **len IPv6**
- Session Pooler podporuje **IPv4 aj IPv6**

---

## 🎯 Riešenie:

**Použi Session Pooler connection string v Render.com!**

Po tomto by malo pripojenie fungovať! 🚀

