# 🚀 Frontend Setup s Render.com Backend

## Backend API je pripravený ✅

**Backend URL:** `https://pizza-system-web.onrender.com`

**Status:** ✅ Všetky endpointy fungujú správne

---

## Frontend Konfigurácia

### 1. Nastaviť Environment Variable

V `frontend/.env.local` (alebo `.env.production`):

```env
NEXT_PUBLIC_API_URL=https://pizza-system-web.onrender.com
```

### 2. Skontrolovať CORS

Backend už má CORS nastavený pre:
- Všetky `.vercel.app` origins
- Localhost (development)
- Custom origins cez `ALLOWED_ORIGINS` environment variable

Ak frontend beží na inom doméne, pridaj ho do `ALLOWED_ORIGINS` v Render.com.

---

## Testovanie Frontend → Backend

### 1. Spustiť Frontend

```bash
cd frontend
npm install
npm run dev
```

### 2. Testovať Endpointy

Frontend by mal automaticky používať `NEXT_PUBLIC_API_URL`:

- **Tenants:** `GET /api/tenants/pornopizza`
- **Products:** `GET /api/pornopizza/products`
- **Categories:** `GET /api/pornopizza/products/categories`

### 3. Testovať v Prehliadači

Otvoriť:
```
http://localhost:3001?tenant=pornopizza
```

Malo by:
- ✅ Načítať tenant dát
- ✅ Zobraziť produkty
- ✅ Zobraziť kategórie
- ✅ Fungovať cart a checkout

---

## Troubleshooting

### Problém: "Backend is not available"

**Riešenie:**
1. Skontroluj `NEXT_PUBLIC_API_URL` v `.env.local`
2. Skontroluj, či backend beží: `https://pizza-system-web.onrender.com/api/health`
3. Skontroluj CORS v backend logoch

### Problém: CORS Error

**Riešenie:**
1. V Render.com → Environment → Pridaj `ALLOWED_ORIGINS`
2. Hodnota: `http://localhost:3001,https://tvoj-frontend-domain.com`
3. Redeploy backend

### Problém: "Tenant not found"

**Riešenie:**
1. Skontroluj, či tenant existuje: `https://pizza-system-web.onrender.com/api/tenants/pornopizza`
2. Skontroluj, či frontend používa správny tenant slug

---

## Production Deployment

### Pre Vercel Deployment:

1. **Vercel Dashboard** → **Settings** → **Environment Variables**
2. Pridaj:
   - `NEXT_PUBLIC_API_URL` = `https://pizza-system-web.onrender.com`
3. Redeploy

### Pre Iné Platformy:

Nastav `NEXT_PUBLIC_API_URL` environment variable na:
```
https://pizza-system-web.onrender.com
```

---

## ✅ Checklist

- [ ] `NEXT_PUBLIC_API_URL` nastavený v `.env.local`
- [ ] Frontend beží lokálne
- [ ] Backend API je dostupný
- [ ] Tenants sa načítajú
- [ ] Produkty sa zobrazujú
- [ ] Cart funguje
- [ ] Checkout funguje

---

## 📊 Backend Status

**URL:** https://pizza-system-web.onrender.com

**Endpoints:**
- ✅ `/api/health` - Health check
- ✅ `/api/tenants` - List tenants
- ✅ `/api/tenants/:slug` - Get tenant
- ✅ `/api/:tenantSlug/products` - Get products
- ✅ `/api/:tenantSlug/products/categories` - Get categories
- ✅ `/api/:tenantSlug/products/:id` - Get product

**Database:**
- ✅ 2 tenants (PornoPizza, Pizza v Núdzi)
- ✅ 38 products pre PornoPizza
- ✅ Migrácie aplikované
- ✅ Seed dáta načítané

---

**Status:** ✅ Backend je pripravený pre frontend integráciu!

