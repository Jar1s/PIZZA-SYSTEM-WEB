# 🚀 Rýchle Vytvorenie Admin Účtu

## ✅ Najrýchlejšie: Cez Render.com Shell

### Krok 1: Otvor Render Shell
1. Choď na: https://dashboard.render.com
2. Vyber backend service (`pizza-ecosystem-api` alebo podobný názov)
3. Klikni na **"Shell"** (v ľavom menu)

### Krok 2: Spusti Script
```bash
cd backend
node create-admin.js
```

**Alebo:**
```bash
cd backend
npm run create-admin
```

### Krok 3: Overenie
Malo by sa zobraziť:
```
✅ Admin user created/updated: admin
📋 Login Credentials:
  Username: admin
  Password: admin123
```

---

## 🔄 Alternatíva: Cez Prisma Seed

Ak `create-admin.js` nefunguje, skús:
```bash
cd backend
npm run prisma:seed
```

Alebo len users:
```bash
cd backend
npx ts-node prisma/seed-users.ts
```

---

## 🧪 Test Po Vytvorení

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

## 📝 Poznámka

Script `create-admin.js` používa `upsert`, takže:
- Ak admin účet už existuje → aktualizuje ho
- Ak neexistuje → vytvorí ho

Bezpečné spustiť viackrát! ✅

