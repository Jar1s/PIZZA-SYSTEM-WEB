# 🧪 Rychlý Test Backendu

## Najít Backend URL

1. **Vercel Dashboard** → Otevři **backend projekt**
2. **Deployments** → Klikni na poslední deployment
3. **Zkopíruj URL** (např. `https://backend-xxx.vercel.app`)

---

## Testovat

### Možnost 1: Automatický Test (Doporučeno)

```bash
cd backend
node test-vercel-endpoints.js https://your-backend-url.vercel.app
```

### Možnost 2: Manuální Test

```bash
# Health check
curl https://your-backend-url.vercel.app/api/health

# Get tenant
curl https://your-backend-url.vercel.app/api/tenants/pornopizza
```

---

## Očekávané Výsledky

✅ **Health check** → `{"status":"ok"}` nebo `200 OK`  
✅ **Get tenant** → JSON s tenant daty (id, slug, name, theme, ...)

---

## Pokud Vidíš Chyby

### PrismaClientInitializationError
- Zkontroluj, že `DATABASE_URL` je správně nastaveno
- Zkontroluj Runtime Logs v Vercel Dashboard

### CORS Errors
- Vypni Deployment Protection
- Zkontroluj, že backend má správnou CORS konfiguraci

### 500 Internal Server Error
- Zkontroluj Build Logs
- Zkontroluj Runtime Logs
- Ověř, že všechny dependencies jsou nainstalované

---

## Po Úspěšném Testu

Pokud všechny testy projdou:
1. ✅ Backend funguje!
2. ✅ Můžeš nastavit frontend `NEXT_PUBLIC_API_URL`
3. ✅ Můžeš testovat celý flow

