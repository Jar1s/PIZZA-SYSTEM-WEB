# ✅ Frontend je pripravený!

## Čo bolo urobené:

1. ✅ Vytvorený/aktualizovaný `frontend/.env.local`
2. ✅ Nastavený `NEXT_PUBLIC_API_URL=https://pizza-system-web.onrender.com`

## Ďalšie kroky:

### 1. Spustiť frontend

```bash
cd frontend
npm install  # ak ešte nie sú nainštalované závislosti
npm run dev
```

### 2. Otvoriť v prehliadači

```
http://localhost:3001?tenant=pornopizza
```

### 3. Očakávané výsledky:

- ✅ Načíta sa tenant "PornoPizza" z Render.com backendu
- ✅ Zobrazí sa 38 produktov (28 pizzas, 9 drinks, 1 dessert)
- ✅ Zobrazia sa kategórie (PIZZA, DRINKS, DESSERTS)
- ✅ Cart a checkout by mali fungovať

## Troubleshooting:

### Ak vidíš "Backend is not available":

1. Skontroluj `.env.local`:
   ```bash
   cat frontend/.env.local
   ```
   Mala by byť hodnota: `NEXT_PUBLIC_API_URL=https://pizza-system-web.onrender.com`

2. Reštartuj dev server:
   - Stlač `Ctrl+C` v termináli kde beží `npm run dev`
   - Spusti znova: `npm run dev`

3. Skontroluj, či backend beží:
   - Otvor: https://pizza-system-web.onrender.com/api/health
   - Mala by sa zobraziť: `{"status":"ok"}`

### Ak vidíš CORS error:

Backend má CORS nastavený pre:
- `localhost` (development)
- Všetky `.vercel.app` origins
- Custom origins cez `ALLOWED_ORIGINS` environment variable

Ak frontend beží na inom porte, môžeš pridať origin do `ALLOWED_ORIGINS` v Render.com.

---

**Status:** ✅ Frontend je pripravený na použitie s Render.com backendom!

