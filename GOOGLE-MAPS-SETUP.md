# 🗺️ Google Maps API Setup Guide

## Pre Address Autocomplete a Map Picker

### 1. Vytvorenie API Key v Google Cloud Console

1. Choď na [Google Cloud Console](https://console.cloud.google.com/)
2. Vyber projekt (alebo vytvor nový)
3. Choď do **APIs & Services** → **Credentials**
4. Klikni na **+ CREATE CREDENTIALS** → **API Key**
5. Skopíruj vytvorený API key

### 2. Povolenie potrebných API

V **APIs & Services** → **Library** povol tieto API:

- ✅ **Places API** - pre autocomplete vyhľadávanie adries
- ✅ **Maps JavaScript API** - pre zobrazenie mapy
- ✅ **Geocoding API** - pre konverziu súradníc na adresu

### 3. Nastavenie API Key restrictions (odporúčané)

**Dôležité:** Po vytvorení API key, Google zobrazí modal "Protect your API key" - odporúča sa nastaviť restrictions.

1. V **Credentials** klikni na vytvorený API key
2. V **API restrictions** vyber **Restrict key**
3. Vyber len tieto API:
   - Places API
   - Maps JavaScript API
   - Geocoding API
4. V **Application restrictions** nastav:
   - **HTTP referrers (web sites)** - pridaj domény:
     - `http://localhost:3001/*`
     - `http://localhost:3000/*` (ak potrebné)
     - `https://tvoja-domena.com/*` (pre produkciu)
   
   **Formát:** `*.example.com/*` alebo `http://localhost:3001/*`

**Poznámka:** Môžeš kliknúť "Maybe later" a nastaviť restrictions neskôr, ale odporúča sa to urobiť hneď pre bezpečnosť.

### 4. Pridanie do projektu

Vytvor alebo uprav `frontend/.env.local`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...tvoj_api_key
```

### 5. Reštart frontend serveru

```bash
cd frontend
npm run dev
```

### 6. Testovanie

1. Otvor `/account?tenant=pornopizza`
2. Klikni na "Moja adresa"
3. Klikni na "Pridať adresu"
4. Začni písať adresu - mali by sa zobraziť suggestions
5. Alebo klikni na ikonu mapy - mala by sa otvoriť mapa

### Troubleshooting

**Problém: "ApiNotActivatedMapError"**
- ⚠️ **Maps JavaScript API nie je povolené!**
- Choď do Google Cloud Console → **APIs & Services** → **Library**
- Vyhľadaj "Maps JavaScript API"
- Klikni na **ENABLE** (Povoliť)
- Počkaj 1-2 minúty a obnov stránku

**Problém: Autocomplete nefunguje**
- Skontroluj, či je Places API povolené
- Skontroluj, či je API key správne v `.env.local`
- Skontroluj konzolu pre chyby

**Problém: Mapa sa nezobrazuje**
- Skontroluj, či je Maps JavaScript API povolené (najčastejší problém!)
- Skontroluj, či je API key správne v `.env.local`
- Skontroluj konzolu pre chyby

**Problém: "This API project is not authorized to use this API"**
- Skontroluj, či sú všetky potrebné API povolené v Google Cloud Console
- Skontroluj billing - Google Maps API vyžaduje aktivovaný billing account

**Problém: 404 Not Found pre `/api/customer/orders` alebo `/api/customer/addresses`**
- Skontroluj, či backend server beží (`npm run start:dev` v `backend/`)
- Reštartuj backend server po pridaní nových routes
- Skontroluj, či máš správny JWT token v Authorization header

### Ceny (približné)

- **Places API (Autocomplete)**: $2.83 za 1000 requests
- **Maps JavaScript API**: $7 za 1000 map loads
- **Geocoding API**: $5 za 1000 requests

Google poskytuje $200 kredit mesačne, čo je dostatočné pre vývoj a testovanie.

