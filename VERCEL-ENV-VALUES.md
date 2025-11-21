# 🔐 Vercel Environment Variables - Hodnoty

## ✅ Connection String (Máš připravený)

```
postgresql://postgres.wfzppetogdcgcjvmrgt:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

**Poznámka:** Toto je connection string s **pooler** (doporučeno pro serverless). Funguje perfektně pro Vercel!

---

## 🔑 JWT Secrets (Vygeneruj tyto hodnoty)

### JWT_SECRET
```
[POUŽIJ HODNOTU Z TERMINÁLU - první openssl rand -base64 32]
```

### JWT_REFRESH_SECRET
```
[POUŽIJ HODNOTU Z TERMINÁLU - druhý openssl rand -base64 32]
```

---

## 📋 Jak Přidat do Vercelu

### 1. DATABASE_URL
```
Key: DATABASE_URL
Value: postgresql://postgres.wfzppetogdcgcjvmrgt:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
Environment: ✅ Production, ✅ Preview
```

### 2. JWT_SECRET
```
Key: JWT_SECRET
Value: [první vygenerovaná hodnota]
Environment: ✅ Production, ✅ Preview
```

### 3. JWT_REFRESH_SECRET
```
Key: JWT_REFRESH_SECRET
Value: [druhá vygenerovaná hodnota]
Environment: ✅ Production, ✅ Preview
```

---

## ⚠️ Důležité

1. **NEPOUŽÍVEJ Development environment** pro sensitive variables (kvůli varování)
2. **Ujisti se, že jsi na Project level**, ne Shared level
3. **Po přidání všech 3 variables:**
   - Klikni **Save**
   - Jdi na **Deployments**
   - **Redeploy** (bez cache)
   - Počkej 2-3 minuty
   - Testuj: `curl https://your-backend.vercel.app/api/health`

---

## 🧪 Test Po Deploymentu

```bash
# Health check
curl https://your-backend.vercel.app/api/health

# Mělo by vrátit: {"status":"ok"} nebo 200 OK
```

**Pokud vidíš chybu:**
- Zkontroluj Runtime Logs v Vercel Dashboard
- Ověř, že všechny 3 variables jsou nastavené
- Ověř, že connection string je správně zkopírovaný (včetně hesla)

