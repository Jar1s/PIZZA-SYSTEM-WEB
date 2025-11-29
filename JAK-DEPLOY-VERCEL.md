# 🚀 Ako Deploynúť Zmeny na Vercel

## ✅ Možnosť 1: Automatický Deployment (Najjednoduchšie)

Vercel automaticky vytvára deployment pri každom push do `main` branch.

### Krok 1: Skontroluj Deployments
1. Choď na [vercel.com](https://vercel.com)
2. Prihlás sa
3. Vyber projekt `pizza-system-web`
4. Choď na **"Deployments"** tab (vľavo v menu)

### Krok 2: Nájdi Najnovší Deployment
- Mala by sa tam zobraziť nová deployment s commitom `50a8550`
- Ak ju vidíš, počkaj, kým sa dokončí build (~2-5 minút)
- Ak ju nevidíš, použij **Možnosť 2**

## 🔧 Možnosť 2: Manuálny Deployment

### Krok 1: Otvor Create Deployment Dialog
1. V Vercel dashboard klikni na **"Deployments"** tab
2. Klikni na tlačidlo **"Create Deployment"** (pravý horný roh)

### Krok 2: Zadaj Branch Name
1. V input fielde **"Commit or Branch Reference"** zadaj:
   ```
   main
   ```
2. **NEPOUŽÍVAJ URL** - len `main`

### Krok 3: Vytvor Deployment
1. Klikni na tlačidlo **"Create Deployment"**
2. Počkaj ~2-5 minút na dokončenie buildu

## 📊 Sledovanie Buildu

Po vytvorení deploymentu:

1. **Klikni na deployment** (v Deployments tab)
2. Sleduj **"Build Logs"** pre progress:
   - ✅ `prebuild` script sa spustí
   - ✅ Skopíruje `shared` modul
   - ✅ `npm run build` sa spustí
   - ✅ Build by mal prejsť bez chýb

3. Po dokončení:
   - Dostaneš URL: `https://your-project.vercel.app`
   - Testuj: `https://your-project.vercel.app?tenant=pornopizza`

## ⚠️ Ak Build Zlyhá

### Skontroluj Build Logs:
1. Klikni na failed deployment
2. Skroluj dole v **"Build Logs"**
3. Hľadaj chyby (červený text)

### Časté Problémy:
- **"Module not found"** → Skontroluj, či `prebuild` script skopíroval `shared` modul
- **"Environment variable missing"** → Skontroluj `NEXT_PUBLIC_API_URL` v Settings → Environment Variables
- **"Build timeout"** → Build trval príliš dlho (zvyčajne sa to nestáva)

## ✅ Úspešný Deployment

Po úspešnom deploymente:
1. ✅ Build prejde bez chýb
2. ✅ Dostaneš URL aplikácie
3. ✅ Môžeš testovať: `https://your-project.vercel.app?tenant=pornopizza`

## 🆘 Potrebuješ Pomoc?

Ak máš problémy:
1. Skontroluj **Build Logs** v failed deployment
2. Skontroluj, či sú nastavené environment variables
3. Skontroluj, či je Root Directory nastavený na `frontend`





