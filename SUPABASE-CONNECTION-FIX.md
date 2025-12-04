# 🔧 Oprava Supabase Connection - SSL Parametr

## Problém:
```
Can't reach database server at `aws-1-eu-west-1.pooler.supabase.com:5432`
```

## ✅ Řešení: Přidat SSL parametr

Supabase **vyžaduje SSL připojení**. Connection string musí obsahovat SSL parametr.

### Správný formát connection stringu:

```
postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require
```

**Nebo s více SSL parametry:**
```
postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require&sslcert=&sslkey=&sslrootcert=
```

### Krok 1: Zkontrolovat DATABASE_URL v Render.com

1. **Render Dashboard** → **PIZZA-SYSTEM-WEB** → **Environment**
2. **Najdi `DATABASE_URL`**
3. **Zkontroluj, jestli obsahuje `?sslmode=require`**

### Krok 2: Aktualizovat DATABASE_URL

**Aktuální (bez SSL):**
```
postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

**Opravený (s SSL):**
```
postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require
```

### Krok 3: Nastavit v Render.com

1. **Render Dashboard** → **PIZZA-SYSTEM-WEB** → **Environment**
2. **Edit `DATABASE_URL`**
3. **Přidej na konec:** `?sslmode=require`
4. **Save Changes**
5. **Render automaticky redeployuje**

### Krok 4: Alternativní SSL parametry

Pokud `sslmode=require` nefunguje, zkus:

```
postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=prefer
```

Nebo:

```
postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?ssl=true
```

---

## Testování lokálně:

```bash
cd backend
export DATABASE_URL="postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
npx prisma db push
```

Pokud to funguje lokálně, funguje to i na Render.com.

---

## Další možnosti:

### 1. Zkontrolovat Supabase Network Restrictions

1. **Supabase Dashboard** → **Settings** → **Database**
2. **Network Restrictions**
3. **Ujisti se, že jsou povoleny všechny IP adresy** (0.0.0.0/0)

### 2. Zkontrolovat, jestli projekt je Active

1. **Supabase Dashboard** → **Project Settings**
2. **Status musí být "Active"** (zelený)

### 3. Zkusit jiný port

Session Pooler může používat port `6543` místo `5432`:

```
postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require
```

---

## Prisma Schema - SSL konfigurace

Prisma automaticky použije SSL parametr z `DATABASE_URL`, takže není potřeba měnit `schema.prisma`.










