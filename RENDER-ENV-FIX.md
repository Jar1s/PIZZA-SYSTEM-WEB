# 🔧 Oprava Environment Variables v Render.com

## Problém:
V `DATABASE_URL` je stále placeholder `[YOUR-PASSWORD]` namiesto skutočného hesla!

## ✅ Riešenie:

### Krok 1: Opraviť DATABASE_URL

V Render.com Dashboard → Environment → `DATABASE_URL`:

**❌ Nesprávne (aktuálne):**
```
postgresql://postgres.gsawehudurchkeysdqhm:[YOUR-PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

**✅ Správne (nahraď `[YOUR-PASSWORD]` → `011jarko`):**
```
postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

### Krok 2: Overiť Všetky Environment Variables

Skontroluj, či máš všetky tieto:

- ✅ `NODE_ENV` = `production` (správne)
- ✅ `JWT_SECRET` = `0ax6regUYrpZssgHfuL3WkSAnCWjDgNYx8B/MLuUyTA=` (správne)
- ✅ `JWT_REFRESH_SECRET` = `161vL9RLeSSXi8CjuEHzElIxzh031LVpEaBkFuprD64=` (správne)
- ⚠️ `DATABASE_URL` = **OPRAVIŤ** - nahraď `[YOUR-PASSWORD]` → `011jarko`
- ℹ️ `PORT` = prázdne je OK (Render automaticky nastaví)

### Krok 3: Uložiť Zmeny

1. **Klikni na "Save Changes"** v Render.com
2. **Render automaticky redeployuje** aplikáciu
3. **Skontroluj logy** - mala by sa zobraziť správa:
   ```
   ✅ Database connected successfully
   🚀 Backend server running on http://localhost:10000
   ```

---

## 📋 Presný Connection String:

```
postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

**Časti:**
- `postgresql://` - protokol
- `postgres.gsawehudurchkeysdqhm` - používateľ (s project reference)
- `011jarko` - **heslo** (nahraď `[YOUR-PASSWORD]`)
- `aws-1-eu-west-1.pooler.supabase.com` - host (Session Pooler)
- `5432` - port
- `postgres` - databáza

---

## ⚠️ Dôležité:

**NEPOUŽÍVAJ placeholder `[YOUR-PASSWORD]`!** Musíš ho nahradiť skutočným heslom: `011jarko`

Po tejto oprave by deployment mal fungovať! 🚀

