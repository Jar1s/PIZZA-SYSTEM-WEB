# 🔧 Oprava Orders Table - userId stĺpec

## ❌ Problém

Backend hovorí:
```
The column `orders.userId` does not exist in the current database.
```

**Príčina:** Databáza nie je synchronizovaná so Prisma schemou. Chýba stĺpec `userId` v tabuľke `orders`.

---

## ✅ Riešenie

### Krok 1: Spusti SQL v Supabase

1. **Choď na:** https://supabase.com/dashboard
2. **Vyber svoj projekt**
3. **Klikni na "SQL Editor"**
4. **Otvor súbor:** `fix-orders-userid.sql`
5. **Skopíruj celý obsah a vlož do SQL Editor**
6. **Klikni "Run"**

### Krok 2: Overenie

Po spustení by si mal vidieť tabuľku s:
- `column_name`: `userId`
- `data_type`: `text`
- `is_nullable`: `YES`

### Krok 3: Test

Po oprave by admin dashboard mal fungovať bez errorov:
- URL: https://pizza-system-web.vercel.app/admin
- Orders by sa mali zobraziť správne

---

## 📝 Čo SQL robí

1. **Pridá `userId` stĺpec** do `orders` tabuľky (nullable TEXT)
2. **Vytvorí foreign key constraint** na `users.id` (ON DELETE SET NULL)
3. **Vytvorí index** pre `userId` (pre rýchlejšie vyhľadávanie)
4. **Zobrazí overenie** - tabuľku s novým stĺpcom

---

## 🔄 Poznámka

`userId` je nullable, pretože:
- Guest objednávky nemajú priradeného užívateľa
- Customer objednávky majú `userId` nastavené

---

**Spusti SQL a daj vedieť, či to funguje!** 🚀

