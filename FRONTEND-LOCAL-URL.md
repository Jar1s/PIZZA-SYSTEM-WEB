# 🌐 Lokálna Verzia Frontendu

## Frontend beží na:

**URL:** http://localhost:3001?tenant=pornopizza

## Ako otvoriť:

1. **Otvoriť prehliadač**
2. **Prejsť na:** `http://localhost:3001?tenant=pornopizza`

## Čo by si mal vidieť:

- ✅ **PornoPizza stránka** s oranžovým témom (#FF6B00)
- ✅ **38 produktov** (28 pizzas, 9 drinks, 1 dessert)
- ✅ **Kategórie:** PIZZA, DRINKS, DESSERTS
- ✅ **Funkčné "Pridať" tlačidlá**
- ✅ **Cart funkcionalita**
- ✅ **Checkout s správnymi farbami**

## Testovanie:

### 1. Homepage
- Otvor: `http://localhost:3001?tenant=pornopizza`
- Mala by sa zobraziť PornoPizza stránka s oranžovými farbami

### 2. Menu
- Scrolluj dole alebo klikni na "Menu"
- Mala by sa zobraziť sekcia s produktmi

### 3. Cart
- Klikni na "Pridať" na niektorom produkte
- Cart sidebar by sa mal zobraziť vpravo
- Cart icon v headeri by mal ukazovať počet položiek

### 4. Checkout
- Pridaj produkty do cartu
- Klikni na "Checkout" alebo cart icon
- Checkout stránka by mala mať správne farby (oranžové)

## Ak nefunguje:

1. **Skontroluj, či backend beží:**
   - Otvor: https://pizza-system-web.onrender.com/api/health
   - Mala by sa zobraziť: `{"status":"ok"}`

2. **Skontroluj `.env.local`:**
   ```bash
   cat frontend/.env.local
   ```
   Mala by byť hodnota: `NEXT_PUBLIC_API_URL=https://pizza-system-web.onrender.com`

3. **Reštartuj frontend:**
   - Stlač `Ctrl+C` v termináli kde beží `npm run dev`
   - Spusti znova: `npm run dev`

---

**Status:** ✅ Frontend beží na http://localhost:3001

