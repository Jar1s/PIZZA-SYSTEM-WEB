# 🔧 Oprava Database Schema

## ❌ Problém

Backend hovorí:
```
The column `users.phone` does not exist in the current database.
```

**Príčina:** Databáza nie je synchronizovaná so Prisma schemou. Chýbajú stĺpce:
- `phone`
- `phoneVerified`
- `email` (pre customer auth)
- `googleId` (pre OAuth)
- `appleId` (pre OAuth)

---

## ✅ Riešenie

### Krok 1: Spusti SQL v Supabase

1. **Choď na:** https://supabase.com/dashboard
2. **Vyber svoj projekt**
3. **Klikni na "SQL Editor"**
4. **Otvor súbor:** `fix-users-phone.sql`
5. **Skopíruj celý obsah a vlož do SQL Editor**
6. **Klikni "Run"**

### Krok 2: Overenie

Po spustení by si mal vidieť tabuľku s 5 stĺpcami:
- `phone` (TEXT, nullable)
- `phoneVerified` (BOOLEAN, default false)
- `email` (TEXT, nullable)
- `googleId` (TEXT, nullable)
- `appleId` (TEXT, nullable)

### Krok 3: Test Login

Po oprave skús znova:
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

---

## 📝 Čo SQL robí

1. **Pridá chýbajúce stĺpce** do `users` tabuľky
2. **Aktualizuje UserRole enum** (pridá `CUSTOMER` ak chýba)
3. **Vytvorí unique indexy** pre `phone`, `email`, `googleId`, `appleId`
4. **Urobí `username` a `password` nullable** (pre OAuth users)
5. **Zobrazí overenie** - tabuľku s novými stĺpcami

---

## 🔄 Alternatíva: Prisma Migrate

Ak chceš použiť Prisma migrate namiesto manuálneho SQL:

```bash
cd backend
npx prisma migrate dev --name add_phone_and_oauth_fields
```

Ale toto vyžaduje lokálny prístup k databáze, čo nemáš (IP restrictions).

**Preto je lepšie použiť SQL súbor v Supabase!** ✅

---

**Spusti SQL a daj vedieť, či to funguje!** 🚀

