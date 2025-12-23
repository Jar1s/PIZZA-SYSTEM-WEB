# 🚨 RÝCHLA OPRAVA: Databázové Pripojenie na Render.com

## Problém:
```
PrismaClientInitializationError: Can't reach database server at `aws-1-eu-west-1.pooler.supabase.com:5432`
Error Code: P1001
```

## ✅ Riešenie: Pridať SSL Parameter

Supabase **vyžaduje SSL pripojenie**. Connection string musí obsahovať `?sslmode=require`.

---

## Krok 1: Otvoriť Render.com Dashboard

1. Choď na: https://dashboard.render.com
2. Klikni na tvoju službu: **pizza-system-web** (alebo podobný názov)
3. V ľavom menu klikni na **"Environment"**

---

## Krok 2: Nájsť a Upraviť DATABASE_URL

1. **Nájdi environment variable:** `DATABASE_URL`
2. **Klikni na "Edit"** (alebo "Update")

---

## Krok 3: Skontrolovať Aktuálnu Hodnotu

**Aktuálna hodnota (bez SSL - NEFUNGUJE):**
```
postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

**Opravená hodnota (s SSL - FUNGUJE):**
```
postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require
```

---

## Krok 4: Aktualizovať DATABASE_URL

1. **Skopíruj túto hodnotu:**
   ```
   postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require
   ```

2. **Vlož ju do "Value" poľa** v Render.com

3. **Klikni "Save Changes"**

4. **Render automaticky redeployuje** službu

---

## Krok 5: Skontrolovať Supabase Firewall

Ak to stále nefunguje, skontroluj Supabase firewall:

1. **Supabase Dashboard** → https://supabase.com/dashboard/project/gsawehudurchkeysdqhm
2. **Settings** → **Database**
3. **Network Restrictions**
4. **Uisti sa, že sú povolené všetky IP adresy** (0.0.0.0/0) alebo aspoň Render.com IP ranges

---

## Alternatíva: Port 6543 (Session Pooler)

Ak port `5432` nefunguje, skús port `6543`:

```
postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require
```

---

## Testovanie Lokálne

Skús pripojiť sa lokálne, aby si overil, že connection string funguje:

```bash
cd backend
export DATABASE_URL="postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
npx prisma db push
```

Ak to funguje lokálne, funguje to aj na Render.com.

---

## Časté Chyby

### ❌ Chyba 1: Chýba SSL parameter
```
postgresql://...@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```
**Riešenie:** Pridaj `?sslmode=require` na koniec

### ❌ Chyba 2: Nesprávny port
**Riešenie:** Skús port `6543` namiesto `5432`

### ❌ Chyba 3: Supabase firewall blokuje
**Riešenie:** Povol všetky IP adresy v Supabase Network Restrictions

---

## Po Oprave

Po uložení `DATABASE_URL` v Render.com:
1. Render automaticky redeployuje službu
2. Počkaj 2-3 minúty na dokončenie deployu
3. Skontroluj logy v Render.com → "Logs"
4. Mala by sa objaviť správa: `✅ Database connected successfully`
















