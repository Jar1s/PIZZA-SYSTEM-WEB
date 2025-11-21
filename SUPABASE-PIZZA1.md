# 🍕 Supabase Projekt: PIZZA1

## Status: ✅ Active

Projekt je připravený! Teď potřebujeme connection string.

---

## Jak získat Connection String:

1. **V Supabase Dashboard:**
   - Klikněte na **Settings** (⚙️) v levém menu
   - Klikněte na **Database**
   - Najděte sekci **Connection string**
   - Vyberte **URI** (ne Session mode)
   - Klikněte na **ikonu kopírování** 📋
   - Zkopírujte celý string

2. **Connection string vypadá takto:**
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   NEBO
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

3. **Project reference najdete:**
   - V URL prohlížeče: `https://supabase.com/dashboard/project/[PROJECT-REF]`
   - Nebo v connection stringu z dashboardu

---

## Po zkopírování:

Pošlete mi celý connection string (včetně hesla) a já spustím migrace!

---

## Nebo zkuste sami:

```bash
cd backend
export DATABASE_URL="[PŘESNÝ_STRING_Z_DASHBOARDU]"
npx prisma migrate deploy
npx prisma db seed
```

