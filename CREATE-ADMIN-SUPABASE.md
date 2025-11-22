# 🚀 Vytvorenie Admin Účtu cez Supabase

## ✅ SQL Súbor je pripravený!

Vytvoril som SQL súbor `create-admin.sql` s hashmi hesiel.

---

## 📋 Kroky:

### 1. Otvor Supabase SQL Editor
1. Choď na: https://supabase.com/dashboard
2. Vyber svoj projekt
3. Klikni na **"SQL Editor"** (v ľavom menu)

### 2. Spusti SQL
1. Otvor súbor `create-admin.sql` (v root priečinku projektu)
2. Skopíruj celý obsah
3. Vlož do Supabase SQL Editor
4. Klikni **"Run"** (alebo Ctrl+Enter)

### 3. Overenie
Po spustení by si mal vidieť:
```
✅ 2 rows inserted
✅ Query result showing admin and operator users
```

---

## 🔑 Login Credentials

Po vytvorení účtov sa môžeš prihlásiť:

**Admin:**
- Username: `admin`
- Password: `admin123`
- URL: https://pizza-system-web.vercel.app/login

**Operator:**
- Username: `operator`
- Password: `operator123`

---

## 🧪 Test

Po vytvorení otestuj login:
```bash
curl -X POST https://pizza-system-web.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Malo by vrátiť:
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

---

## 📝 Poznámka

SQL používa `ON CONFLICT`, takže:
- Ak účet už existuje → aktualizuje ho
- Ak neexistuje → vytvorí ho

**Bezpečné spustiť viackrát!** ✅

