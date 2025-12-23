# 🆕 Vytvorenie Nového Projektu na Vercel

## 📋 Krok za Krokom

### Krok 1: Otvor Vercel Dashboard
1. Choď na [vercel.com](https://vercel.com)
2. Prihlás sa (ak nie si prihlásený)

### Krok 2: Vytvor Nový Projekt
1. Klikni na **"Add New..."** (pravý horný roh)
2. Klikni na **"Project"**

### Krok 3: Vyber Repository
1. V zozname repository nájdi: **`Jar1s/PIZZA-SYSTEM-WEB`**
2. Klikni na **"Import"** vedľa neho

### Krok 4: Konfigurácia Projektu

#### 4.1 Project Name
- **Project Name:** `pizza-system-web` (alebo akýkoľvek názov)
- Môžeš nechať predvolený

#### 4.2 Framework Preset
- **Framework Preset:** `Next.js`
- Vercel by to malo automaticky detekovať

#### 4.3 Root Directory ⚠️ DÔLEŽITÉ!
1. Klikni na **"Edit"** vedľa "Root Directory"
2. Zadaj: `frontend`
3. Potvrď

#### 4.4 Build and Output Settings
- **Build Command:** `npm run build` (alebo nechať prázdne - Vercel to detekuje)
- **Output Directory:** `.next` (alebo nechať prázdne)
- **Install Command:** `npm install` (alebo nechať prázdne)

### Krok 5: Environment Variables ⚠️ DÔLEŽITÉ!

1. Rozbal sekciu **"Environment Variables"**
2. Klikni na **"+ Add More"**
3. Pridaj:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://pizza-system-web.onrender.com`
4. Uisti sa, že je zaškrtnuté pre:
   - ✅ Production
   - ✅ Preview
   - ✅ Development (voliteľné)

### Krok 6: Deploy!
1. Skontroluj všetky nastavenia
2. Klikni na tlačidlo **"Deploy"** (modré tlačidlo vpravo dole)
3. Počkaj ~2-5 minút na dokončenie buildu

## 📊 Sledovanie Buildu

Po kliknutí na "Deploy":
1. Zobrazí sa progress screen
2. Sleduj **Build Logs**:
   - ✅ Installing dependencies
   - ✅ Running `prebuild` script (skopíruje shared modul)
   - ✅ Running `npm run build`
   - ✅ Build successful

## ✅ Po Úspešnom Deploymente

1. Dostaneš URL: `https://pizza-system-web.vercel.app` (alebo podobný)
2. Klikni na URL alebo choď na **Deployments** tab
3. Testuj:
   - `https://your-project.vercel.app?tenant=pornopizza`
   - `https://your-project.vercel.app?tenant=pizzavnudzi`

## ⚠️ Dôležité Kontroly

Pred deployom skontroluj:
- ✅ **Root Directory:** `frontend` (NIE prázdne!)
- ✅ **Framework Preset:** `Next.js`
- ✅ **Environment Variable:** `NEXT_PUBLIC_API_URL` je nastavený
- ✅ **Repository:** `Jar1s/PIZZA-SYSTEM-WEB`

## 🆘 Ak Build Zlyhá

### Skontroluj Build Logs:
1. Klikni na failed deployment
2. Skroluj dole v **Build Logs**
3. Hľadaj chyby (červený text)

### Časté Problémy:
- **"Module not found: @pizza-ecosystem/shared"**
  - ✅ Riešenie: `prebuild` script by mal skopírovať shared modul
  - Skontroluj, či sa `prebuild` script spustil v build logs

- **"Environment variable missing"**
  - ✅ Riešenie: Skontroluj, či je `NEXT_PUBLIC_API_URL` nastavený

- **"Root Directory not found"**
  - ✅ Riešenie: Skontroluj, či je Root Directory nastavený na `frontend`

## 🎯 Úspešný Deployment

Po úspešnom deploymente:
- ✅ Build prejde bez chýb
- ✅ Dostaneš URL aplikácie
- ✅ Môžeš testovať frontend s backendom na Render.com
















