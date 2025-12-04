# 🗺️ Rýchle Riešenie: Google Maps API Key

## Problém
```
Google Maps API key is not set. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local
```

## Riešenie

### Ak bežíš LOKÁLNE (localhost):

1. **Získaj Google Maps API Key:**
   - Choď na [Google Cloud Console](https://console.cloud.google.com/)
   - Vyber projekt → **APIs & Services** → **Credentials**
   - Klikni **+ CREATE CREDENTIALS** → **API Key**
   - Skopíruj API key

2. **Povol potrebné API:**
   - V **APIs & Services** → **Library** povol:
     - ✅ **Places API**
     - ✅ **Maps JavaScript API**
     - ✅ **Geocoding API**

3. **Pridaj do `.env.local`:**
   ```bash
   cd frontend
   ```
   
   Otvor `frontend/.env.local` a zmeň:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=TU_VLOZ_SVOJ_API_KEY
   ```
   
   Na:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...tvoj_skutocny_api_key
   ```

4. **Reštartuj server:**
   ```bash
   # Zastav server (Ctrl+C) a spusti znova:
   npm run dev
   ```

---

### Ak bežíš na PRODUKCII (Vercel):

1. **Získaj Google Maps API Key** (rovnako ako vyššie)

2. **Pridaj do Vercel Environment Variables:**
   - Choď na [vercel.com/dashboard](https://vercel.com/dashboard)
   - Vyber svoj projekt
   - Klikni **Settings** → **Environment Variables**
   - Klikni **Add New**
   - **Key:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value:** `AIzaSy...tvoj_api_key`
   - **Environment:** Zaškrtni všetky (Production, Preview, Development)
   - Klikni **Save**

3. **Nastav API Restrictions v Google Cloud Console:**
   - Choď do **Credentials** → klikni na svoj API key
   - V **Application restrictions** → **HTTP referrers (web sites)**
   - Pridaj:
     - `https://tvoj-projekt.vercel.app/*`
     - `https://*.vercel.app/*` (pre preview deployments)
     - `http://localhost:3001/*` (pre lokálny vývoj)

4. **Redeploy na Vercel:**
   - Choď na **Deployments**
   - Klikni na tri bodky (⋯) vedľa najnovšieho deploymentu
   - Klikni **Redeploy**
   - Alebo pushni nový commit do GitHubu

---

## ✅ Overenie

Po nastavení:

1. **Lokálne:** Otvor `http://localhost:3001/account?tenant=pornopizza` → "Moja adresa" → "Pridať adresu"
2. **Produkcia:** Otvor `https://tvoj-projekt.vercel.app/account?tenant=pornopizza` → "Moja adresa" → "Pridať adresu"

Malo by:
- ✅ Fungovať autocomplete pri písaní adresy
- ✅ Otvoriť sa mapa pri kliknutí na ikonu mapy
- ✅ Nebyť chyba v konzole

---

## 🐛 Troubleshooting

**"ApiNotActivatedMapError"**
- ⚠️ Maps JavaScript API nie je povolené v Google Cloud Console
- Choď do **APIs & Services** → **Library** → vyhľadaj "Maps JavaScript API" → **ENABLE**

**"This API project is not authorized"**
- Skontroluj, či sú všetky 3 API povolené (Places, Maps JavaScript, Geocoding)
- Skontroluj billing - Google Maps vyžaduje aktivovaný billing account

**"Failed to load Google Maps API"**
- Skontroluj, či je API key správne v `.env.local` (lokálne) alebo Vercel (produkcia)
- Skontroluj API restrictions v Google Cloud Console
- Počkaj 1-2 minúty po zmene restrictions a obnov stránku

---

**Hotovo!** 🎉 Google Maps by teraz mal fungovať.




