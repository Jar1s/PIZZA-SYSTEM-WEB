# 🔍 Diagnostika Databázového Pripojenia

## Problém:
Databáza sa nemôže pripojiť ani na Fly.io, ani na Render.com. To naznačuje problém v databáze alebo connection stringu, nie v platforme.

## Možné Príčiny:

### 1. ❌ Databáza neexistuje alebo nie je aktívna
- Supabase projekt môže byť zmazaný alebo pozastavený
- Databáza môže byť stále v procese vytvárania

### 2. ❌ Nesprávny connection string
- Heslo môže byť nesprávne
- Host môže byť nesprávny
- Port môže byť nesprávny

### 3. ❌ Databáza nie je prístupná z vonku
- Supabase môže mať obmedzenia
- Projekt môže byť v inom režime

## ✅ Riešenie - Krok za Krokom:

### Krok 1: Overiť, či Supabase projekt existuje a je aktívny

1. **Choď do Supabase Dashboard**: https://supabase.com/dashboard/project/gsawehudurchkeysdqhm
2. **Skontroluj status projektu:**
   - Musí byť **"Active"** (zelený)
   - Ak je **"Paused"** alebo **"Setting up"**, počkaj alebo aktivuj projekt

### Krok 2: Získať správny connection string z Supabase

**NEPOUŽÍVAJ connection string, ktorý si napísal ručne!**

1. **Supabase Dashboard** → **Settings** → **Database**
2. **Nájdi sekciu "Connection string"**
3. **Vyber "URI"** (nie Session mode, nie Transaction mode)
4. **Klikni na ikonu kopírovania** 📋
5. **Skopíruj celý string** - vyzerá takto:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   ALEBO
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### Krok 3: Overiť heslo

Ak connection string obsahuje `[YOUR-PASSWORD]` alebo `[PASSWORD]`:
1. **Supabase Dashboard** → **Settings** → **Database**
2. **Nájdi "Database password"**
3. **Ak nevidíš heslo**, môžeš ho resetovať:
   - **Settings** → **Database** → **Reset database password**
   - Nastav nové heslo (napr. `011jarko`)
   - Skopíruj nový connection string

### Krok 4: Testovať pripojenie lokálne

**Test 1: Pomocou Prisma**
```bash
cd backend
export DATABASE_URL="[SKOPÍROVANÝ_STRING_Z_SUPABASE]"
npx prisma db pull
```

**Test 2: Pomocou psql** (ak máš nainštalovaný PostgreSQL)
```bash
psql "[SKOPÍROVANÝ_STRING_Z_SUPABASE]"
```

Ak lokálne testy zlyhajú, problém je v databáze alebo connection stringu.

### Krok 5: Skúsiť Pooler Connection String

Supabase odporúča používať **Connection Pooler** pre produkciu:

1. **Supabase Dashboard** → **Settings** → **Database**
2. **Connection Pooling** → **Session mode**
3. **Skopíruj connection string**
4. **Nahraď `[YOUR-PASSWORD]`** → tvoje heslo

**Pooler string vyzerá takto:**
```
postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

### Krok 6: Vytvoriť novú databázu (ak nič nefunguje)

Ak stará databáza nefunguje:

1. **Supabase Dashboard** → **New Project**
2. **Vytvor nový projekt**
3. **Získaj nový connection string**
4. **Spusti migrácie:**
   ```bash
   cd backend
   export DATABASE_URL="[NOVÝ_CONNECTION_STRING]"
   npx prisma migrate deploy
   npx prisma db seed
   ```

---

## 🔍 Diagnostika:

### Otázky na overenie:

1. **Je Supabase projekt aktívny?**
   - Choď do dashboardu a skontroluj status

2. **Máš správny connection string?**
   - Skopíroval si ho priamo z Supabase dashboardu?
   - Alebo si ho napísal ručne?

3. **Funguje connection string lokálne?**
   - Skús pripojiť sa z lokálneho počítača
   - Ak nefunguje lokálne, problém nie je v Render.com

4. **Je heslo správne?**
   - Over v Supabase Dashboard → Settings → Database
   - Alebo resetuj heslo

---

## 🎯 Odporúčanie:

**Najlepšie riešenie:**
1. Choď do Supabase Dashboard
2. Skopíruj **presný** connection string (nie ručne napísaný!)
3. Použi ho v Render.com ako `DATABASE_URL`
4. Ak to nefunguje, skús **pooler** connection string

**Ak nič nefunguje:**
- Vytvor novú databázu v Supabase
- Spusti migrácie
- Použi nový connection string

---

## 📋 Checklist:

- [ ] Supabase projekt je aktívny
- [ ] Connection string je skopírovaný z dashboardu (nie ručne napísaný)
- [ ] Heslo je správne
- [ ] Connection string funguje lokálne
- [ ] Skúsený pooler connection string
- [ ] DATABASE_URL je nastavený v Render.com

