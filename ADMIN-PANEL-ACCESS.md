# 🔐 Ako sa Dostať k Admin Panelu - Production

## 📍 URL

### Frontend (Vercel):
```
https://pizza-system-web.vercel.app/admin
```

### Backend (Render):
```
https://pizza-system-web.onrender.com
```

---

## 🔑 Login

### 1. Otvor Admin Panel:
```
https://pizza-system-web.vercel.app/admin
```

### 2. Ak nie si prihlásený:
Presmeruje ťa na:
```
https://pizza-system-web.vercel.app/login
```

### 3. Credentials:
- **Username:** `admin`
- **Password:** `admin123`

---

## ❌ Problém: 500 Internal Server Error

Ak vidíš "Internal server error" pri login, znamená to, že:
- Backend beží ✅
- Admin účet **neexistuje** v databáze ❌

---

## ✅ Riešenie: Vytvor Admin Účet

### Možnosť 1: Cez Render.com Shell (najrýchlejšie)

1. **Choď na:** https://dashboard.render.com
2. **Vyber backend service** (`pizza-ecosystem-api` alebo podobný názov)
3. **Klikni na "Shell"** (v ľavom menu)
4. **Spusti:**
```bash
cd backend
npm run prisma:seed
```

Alebo len vytvor admin účet:
```bash
cd backend
npx ts-node prisma/seed-users.ts
```

Toto vytvorí:
- **Admin:** `admin` / `admin123`
- **Operator:** `operator` / `operator123`

### Možnosť 2: Cez Supabase Dashboard

1. **Choď na:** https://supabase.com/dashboard
2. **Vyber tvoj projekt**
3. **Table Editor** → **users**
4. **Insert row:**
   - `username`: `admin`
   - `password`: (hash - pozri nižšie)
   - `name`: `Admin User`
   - `role`: `ADMIN`
   - `isActive`: `true`

**Hash hesla:**
```bash
# V Render Shell:
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(h => console.log(h))"
```

Skopíruj hash a vlož do `password` poľa.

---

## 🧪 Test Po Vytvorení Admin Účtu

### 1. Test Login Endpoint:
```bash
curl -X POST https://pizza-system-web.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Očakávaná odpoveď:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "...",
  "user": {
    "id": "...",
    "username": "admin",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

### 2. Test v Prehliadači:
1. Otvor: https://pizza-system-web.vercel.app/login
2. Prihlás sa: `admin` / `admin123`
3. Mala by ťa presmerovať na `/admin`

---

## 🔍 Troubleshooting

### Problém: "Not Found" (404)
**Príčina:** Nesprávna backend URL

**Riešenie:**
- Skontroluj `NEXT_PUBLIC_API_URL` v Vercel Dashboard
- Mala by byť: `https://pizza-system-web.onrender.com`

### Problém: "Internal server error" (500)
**Príčina:** Admin účet neexistuje alebo databázový problém

**Riešenie:**
1. Vytvor admin účet cez Render Shell (možnosť 1 vyššie)
2. Skontroluj backend logy v Render Dashboard → Logs

### Problém: "Invalid credentials" (401)
**Príčina:** Nesprávne heslo alebo účet neexistuje

**Riešenie:**
1. Skontroluj, či admin účet existuje v databáze
2. Skontroluj, či heslo je správne hashované

---

## 📋 Checklist

- [ ] Backend beží: `https://pizza-system-web.onrender.com/api/health` → `{"status":"ok"}`
- [ ] Admin účet existuje v databáze
- [ ] `NEXT_PUBLIC_API_URL` je nastavené v Vercel na `https://pizza-system-web.onrender.com`
- [ ] Login endpoint funguje (test curl vyššie)
- [ ] Frontend sa môže pripojiť k backendu

---

## 🚀 Po Úspešnom Prihlásení

Admin panel obsahuje:
- **Dashboard** - KPI cards, order list
- **Orders** - Správa objednávok
- **Products** - Správa produktov
- **Brands** - Správa brandov
- **Customers** - Správa zákazníkov
- **Analytics** - Grafy a štatistiky

---

**Hotovo!** 🎉 Po vytvorení admin účtu by login mal fungovať.

