# 🔧 Vercel Environment Variables Setup - Frontend

## 📋 Potrebné Environment Variables

Pre frontend deployment na Vercel musíš nastaviť tieto environment variables:

### 🔴 POVINNÉ

#### 1. NEXT_PUBLIC_API_URL
```
Key: NEXT_PUBLIC_API_URL
Value: https://pizza-ecosystem-api.onrender.com
Environment: ✅ Production, ✅ Preview, ✅ Development
```

**Dôležité:**
- Toto je URL tvojho backend API na Render.com
- Musí byť `https://` (nie `http://`)
- Bez trailing slash (`/`)

### 🟡 VOLITEĽNÉ (pre tracking a monitoring)

#### 2. NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (Google Maps - pre adresy)
```
Key: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
Value: AIzaSy...tvoj_api_key
Environment: ✅ Production, ✅ Preview, ✅ Development
```

**Ako získať:**
1. Choď na [Google Cloud Console](https://console.cloud.google.com/)
2. Vyber projekt (alebo vytvor nový)
3. Choď do **APIs & Services** → **Credentials**
4. Klikni na **+ CREATE CREDENTIALS** → **API Key**
5. Skopíruj vytvorený API key
6. V **APIs & Services** → **Library** povol:
   - **Places API** (pre autocomplete)
   - **Maps JavaScript API** (pre mapu)
   - **Geocoding API** (pre konverziu súradníc)

**Dôležité:**
- Google Maps API vyžaduje aktivovaný billing account
- Google poskytuje $200 mesačný kredit (dostatočné pre vývoj a testovanie)
- Odporúča sa nastaviť API restrictions v Google Cloud Console

#### 3. NEXT_PUBLIC_GA_ID (Google Analytics)
```
Key: NEXT_PUBLIC_GA_ID
Value: G-XXXXXXXXXX
Environment: ✅ Production, ✅ Preview
```

**Ako získať:**
- Google Analytics → Admin → Data Streams → Copy Measurement ID

#### 4. NEXT_PUBLIC_FB_PIXEL_ID (Facebook Pixel)
```
Key: NEXT_PUBLIC_FB_PIXEL_ID
Value: XXXXXXXXXX
Environment: ✅ Production, ✅ Preview
```

**Ako získať:**
- Facebook Events Manager → Create Pixel → Copy Pixel ID

#### 5. NEXT_PUBLIC_SENTRY_DSN (Error Tracking)
```
Key: NEXT_PUBLIC_SENTRY_DSN
Value: https://xxx@xxx.ingest.sentry.io/xxx
Environment: ✅ Production, ✅ Preview
```

**Ako získať:**
- Sentry Dashboard → Project Settings → Client Keys (DSN)

---

## 🚀 Ako Nastaviť na Vercel

### Krok 1: Otvor Vercel Dashboard
1. Choď na [vercel.com/dashboard](https://vercel.com/dashboard)
2. Vyber svoj projekt (frontend)

### Krok 2: Pridaj Environment Variables
1. Klikni na **Settings** (v hornej navigácii)
2. Klikni na **Environment Variables** (v ľavom menu)
3. Klikni na **Add New** alebo **+ Add**

### Krok 3: Pridaj Každú Premennú

#### NEXT_PUBLIC_API_URL
1. **Key:** `NEXT_PUBLIC_API_URL`
2. **Value:** `https://pizza-ecosystem-api.onrender.com`
3. **Environment:** Zaškrtni všetky (Production, Preview, Development)
4. Klikni **Save**

#### NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (pre adresy)
1. **Key:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
2. **Value:** `AIzaSy...tvoj_api_key` (tvoj Google Maps API key)
3. **Environment:** Zaškrtni všetky (Production, Preview, Development)
4. Klikni **Save**

**Poznámka:** Po pridaní API key musíš v Google Cloud Console nastaviť HTTP referrer restrictions:
- `https://tvoj-projekt.vercel.app/*`
- `https://*.vercel.app/*` (pre preview deployments)

#### NEXT_PUBLIC_GA_ID (ak máš)
1. **Key:** `NEXT_PUBLIC_GA_ID`
2. **Value:** `G-XXXXXXXXXX` (tvoj Google Analytics ID)
3. **Environment:** Production, Preview
4. Klikni **Save**

#### NEXT_PUBLIC_FB_PIXEL_ID (ak máš)
1. **Key:** `NEXT_PUBLIC_FB_PIXEL_ID`
2. **Value:** `XXXXXXXXXX` (tvoj Facebook Pixel ID)
3. **Environment:** Production, Preview
4. Klikni **Save**

#### NEXT_PUBLIC_SENTRY_DSN (ak máš)
1. **Key:** `NEXT_PUBLIC_SENTRY_DSN`
2. **Value:** `https://xxx@xxx.ingest.sentry.io/xxx` (tvoj Sentry DSN)
3. **Environment:** Production, Preview
4. Klikni **Save**

### Krok 4: Redeploy
Po pridaní environment variables:
1. Choď na **Deployments** tab
2. Klikni na tri bodky (⋯) vedľa najnovšieho deploymentu
3. Klikni **Redeploy**
4. Alebo jednoducho pushni nový commit do GitHubu

---

## ✅ Overenie

Po redeploymente skontroluj:

### 1. Backend Connection
Otvori v prehliadači:
```
https://tvoj-projekt.vercel.app?tenant=pornopizza
```

Malo by:
- ✅ Načítať tenant dát
- ✅ Zobraziť produkty
- ✅ Fungovať cart a checkout

### 2. Environment Variables v Build Logs
V **Deployments** → **Build Logs** by si mal vidieť:
```
- Installing dependencies
- Running "npm run build"
- Build successful
```

### 3. Console v Prehliadači
Otvori Developer Tools (F12) → Console:
- ✅ Nemali by byť chyby typu "API_URL is not defined"
- ✅ Network tab by mal ukazovať requesty na `https://pizza-ecosystem-api.onrender.com`

---

## 🐛 Troubleshooting

### Problém: "Backend is not available"
**Riešenie:**
1. Skontroluj `NEXT_PUBLIC_API_URL` v Vercel Dashboard
2. Skontroluj, či backend beží: `https://pizza-ecosystem-api.onrender.com/api/health`
3. Skontroluj CORS v backend logoch (Render.com)

### Problém: "Environment variable not found"
**Riešenie:**
1. Uisti sa, že premenná začína `NEXT_PUBLIC_` (pre frontend)
2. Redeploy projekt po pridaní premenných
3. Skontroluj, že je zaškrtnuté pre správne environment (Production/Preview)

### Problém: "CORS Error"
**Riešenie:**
1. V Render.com → Environment Variables → Pridaj `ALLOWED_ORIGINS`
2. Hodnota: `https://tvoj-projekt.vercel.app,https://tvoj-projekt.vercel.app`
3. Redeploy backend na Render.com

---

## 📝 Poznámky

- **`NEXT_PUBLIC_*`** premenné sú dostupné v prehliadači (client-side)
- **Bez `NEXT_PUBLIC_`** premenné sú len server-side (Next.js API routes)
- Po pridaní premenných **musíš redeployovať** projekt
- Vercel automaticky redeployuje pri push do GitHubu (ak je to zapnuté)

---

## 🎯 Rýchly Checklist

- [ ] `NEXT_PUBLIC_API_URL` nastavené na Render.com backend URL
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` nastavené (ak používaš adresy)
- [ ] Environment variables pridané pre Production a Preview
- [ ] Projekt redeployovaný po pridaní premenných
- [ ] Backend beží a je dostupný
- [ ] Frontend úspešne komunikuje s backendom
- [ ] Google Maps API key má nastavené restrictions v Google Cloud Console

---

**Hotovo!** 🎉 Frontend by teraz mal fungovať s backendom na Render.com.





