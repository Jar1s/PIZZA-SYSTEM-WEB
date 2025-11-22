# 🔗 Jak získat Supabase Connection String

## Krok za krokem:

1. **Jděte na Supabase Dashboard:**
   https://supabase.com/dashboard/project/nrhrncokptwuxlgkadxu

2. **V levém menu klikněte na:**
   ⚙️ **Settings**

3. **Klikněte na:**
   📊 **Database**

4. **Najděte sekci:**
   **Connection string**

5. **Vyberte:**
   **URI** (ne Session mode, ne Transaction mode)

6. **Klikněte na ikonu kopírování** 📋

7. **Zkopírujte celý string** - vypadá takto:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   NEBO
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

---

## ⚠️ Důležité:

- **API Key** (anon key) = pro REST API volání (frontend)
- **Connection String** = pro přímé připojení k PostgreSQL (migrace, Prisma)

**Pro migrace potřebujeme Connection String, ne API key!**

---

## Pokud nevidíte Connection String:

1. Zkontrolujte, jestli je projekt **Active** (zelený status)
2. Pokud se projekt stále vytváří, počkejte 2-5 minut
3. Zkuste obnovit stránku (F5)

---

## Po zkopírování:

Pošlete mi celý connection string (včetně hesla) a já spustím migrace!


