# 🧪 Test Deployment - Vercel Backend

## ✅ Environment Variables Nastavené

Vidím, že máš všechny potřebné variables:
- ✅ `DATABASE_URL` - Production
- ✅ `JWT_SECRET` - Production  
- ✅ `JWT_REFRESH_SECRET` - All Environments
- ✅ `ALLOWED_ORIGINS` - Production

---

## 🚀 Další Kroky

### 1. Redeploy (Pokud ještě neudělal)

1. Vercel Dashboard → **Deployments**
2. Klikni **...** (tři tečky) u posledního deploymentu
3. Vyber **Redeploy**
4. **DŮLEŽITÉ:** Odškrtni **"Use existing Build Cache"**
5. Klikni **Redeploy**
6. Počkej 2-3 minuty na dokončení

### 2. Najít Backend URL

Backend URL by měl být něco jako:
```
https://backend-xxx.vercel.app
```
nebo
```
https://your-project-name.vercel.app
```

**Kde najít:**
- Vercel Dashboard → Projekt → **Deployments**
- Klikni na poslední deployment
- URL je v horní části stránky

### 3. Testovat Endpointy

#### Health Check
```bash
curl https://your-backend.vercel.app/api/health
```

**Očekávaná odpověď:**
```json
{"status":"ok"}
```
nebo
```
200 OK
```

#### Get Tenant
```bash
curl https://your-backend.vercel.app/api/tenants/pornopizza
```

**Očekávaná odpověď:**
```json
{
  "id": "...",
  "slug": "pornopizza",
  "name": "PornoPizza",
  ...
}
```

#### Get Products
```bash
curl https://your-backend.vercel.app/api/pornopizza/products
```

---

## 🔍 Troubleshooting

### Pokud vidíš chyby:

#### 1. PrismaClientInitializationError
**Příčina:** DATABASE_URL není správně nastaveno nebo database není dostupná

**Řešení:**
- Zkontroluj Runtime Logs v Vercel Dashboard
- Ověř, že connection string je správný
- Zkontroluj, že Supabase database je running

#### 2. CORS Errors
**Příčina:** Deployment Protection blokuje OPTIONS requests

**Řešení:**
- Vercel Dashboard → Settings → Deployment Protection
- Vypni **Deployment Protection** nebo nastav na **Public**

#### 3. 500 Internal Server Error
**Příčina:** Chyba v kódu nebo missing dependencies

**Řešení:**
- Zkontroluj Build Logs (měly by být bez chyb)
- Zkontroluj Runtime Logs (hledej error messages)
- Ověř, že všechny dependencies jsou v `package.json`

---

## ✅ Deployment Checklist

- [ ] Všechny environment variables jsou nastavené ✅
- [ ] Redeploy projekt (bez cache)
- [ ] Počkat na dokončení buildu (2-3 min)
- [ ] Testovat `/api/health` endpoint
- [ ] Testovat `/api/tenants/pornopizza` endpoint
- [ ] Zkontrolovat Runtime Logs (pokud jsou chyby)
- [ ] Vypnout Deployment Protection (pokud blokuje CORS)

---

## 🎯 Co Dál?

Po úspěšném deploymentu:

1. **Frontend Setup:**
   - Přidat `NEXT_PUBLIC_API_URL` do frontend Vercel projektu
   - Nastavit na backend URL: `https://your-backend.vercel.app`

2. **Testovat Celý Flow:**
   - Načíst frontend
   - Zobrazit menu
   - Přidat produkt do košíku
   - Vytvořit objednávku

3. **Monitoring:**
   - Sledovat Vercel Logs
   - Sledovat Supabase Dashboard (database queries)

---

## 💡 Tip

Pokud máš backend URL, můžu ti pomoci otestovat všechny endpointy automaticky!

