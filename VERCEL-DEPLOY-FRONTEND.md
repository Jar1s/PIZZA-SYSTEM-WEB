# 🚀 Vercel Deployment Guide - Frontend

Kompletný guide na nasadenie frontendu na Vercel.

## 📋 Predpoklady

1. ✅ GitHub repository s frontend kódom
2. ✅ Vercel účet (bezplatný)
3. ✅ Backend API už nasadený na Render.com (`https://pizza-system-web.onrender.com`)

## 🔧 Krok 1: Vercel Setup

### 1.1 Prihlásenie do Vercel

1. Choď na [vercel.com](https://vercel.com)
2. Prihlás sa cez GitHub
3. Autorizuj Vercel prístup k tvojmu GitHub účtu

### 1.2 Import projektu

1. Klikni na **"Add New..."** → **"Project"**
2. Vyber svoj GitHub repository (`PIZZA-SYSTEM-WEB`)
3. Vercel automaticky detekuje Next.js framework

## ⚙️ Krok 2: Konfigurácia projektu

### 2.1 Root Directory

**DÔLEŽITÉ:** Nastav Root Directory na `frontend`:

```
Root Directory: frontend
```

### 2.2 Build Settings

Vercel automaticky detekuje Next.js, ale skontroluj:

- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (alebo `cd frontend && npm run build` ak je root directory nastavený)
- **Output Directory:** `.next` (automaticky)
- **Install Command:** `npm install` (alebo `cd frontend && npm install`)

### 2.3 Environment Variables

Pridaj tieto environment variables v **Settings → Environment Variables**:

```env
NEXT_PUBLIC_API_URL=https://pizza-system-web.onrender.com
NODE_ENV=production
```

**Dôležité:**
- `NEXT_PUBLIC_*` premenné sú dostupné v prehliadači
- Nastav pre **Production**, **Preview**, a **Development** (ak potrebuješ)

### 2.4 Domény (voliteľné)

Ak máš vlastné domény:
- **Settings → Domains**
- Pridaj `pornopizza.sk` a `pizzavnudzi.sk`
- Vercel automaticky nastaví DNS záznamy

## 🚀 Krok 3: Deployment

### 3.1 Automatický Deployment

1. Klikni **"Deploy"**
2. Vercel:
   - Nainštaluje dependencies
   - Spustí build
   - Nasadiť aplikáciu
3. Počkaj ~2-5 minút na dokončenie

### 3.2 Manuálny Deployment (cez CLI)

```bash
# Inštalácia Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy z frontend priečinka
cd frontend
vercel

# Production deploy
vercel --prod
```

## ✅ Krok 4: Overenie

### 4.1 Testovanie URL

Po úspešnom deploymente dostaneš URL:
```
https://your-project.vercel.app
```

Testuj:
- `https://your-project.vercel.app?tenant=pornopizza`
- `https://your-project.vercel.app?tenant=pizzavnudzi`

### 4.2 Kontrola Logov

1. Choď na **Deployments** tab
2. Klikni na najnovší deployment
3. Skontroluj **Build Logs** pre chyby

### 4.3 Testovanie Funkcionality

1. ✅ Načítanie menu produktov
2. ✅ Pridanie do košíka
3. ✅ Checkout flow
4. ✅ Multi-tenant theming
5. ✅ API komunikácia s backendom

## 🔍 Troubleshooting

### Problém: Build fails

**Riešenie:**
1. Skontroluj **Build Logs** v Vercel dashboard
2. Skontroluj, či je `NEXT_PUBLIC_API_URL` nastavený
3. Skontroluj, či sú všetky dependencies v `package.json`

### Problém: "Cannot find module"

**Riešenie:**
```bash
# Lokálne testovanie build
cd frontend
npm run build

# Ak build prejde lokálne, problém môže byť v:
# - Root Directory nastavení
# - Missing dependencies
```

### Problém: CORS errors

**Riešenie:**
- Backend už má CORS nastavené pre Vercel domény
- Skontroluj, či `NEXT_PUBLIC_API_URL` ukazuje na správny backend URL
- Backend automaticky povolí všetky `*.vercel.app` domény

### Problém: Environment variables nie sú dostupné

**Riešenie:**
1. Skontroluj **Settings → Environment Variables**
2. Uisti sa, že sú nastavené pre správny environment (Production/Preview)
3. Redeploy po pridaní nových premenných

## 📝 Vercel Configuration Files

### `vercel.json`

Už existuje v `frontend/vercel.json`:
- Nastavený framework: Next.js
- Region: Frankfurt (fra1)
- Security headers

### `next.config.js`

Už obsahuje:
- Image optimization
- Sentry integration (ak je nastavené)
- Package transpilation pre `@pizza-ecosystem/shared`

## 🔄 Continuous Deployment

Vercel automaticky:
- ✅ Deployuje pri každom push do `main` branch
- ✅ Vytvára Preview deployments pre PR
- ✅ Rollback na predchádzajúci deployment pri chybe

## 🌐 Custom Domains

### Nastavenie domén

1. **Settings → Domains**
2. Pridaj doménu: `pornopizza.sk`
3. Vercel poskytne DNS záznamy:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```
4. Pridaj DNS záznamy do tvojho DNS providera
5. Počkaj na DNS propagation (~5-30 minút)

### Multi-tenant Domains

Pre každý tenant môžeš nastaviť:
- `pornopizza.sk` → hlavný deployment
- `pizzavnudzi.sk` → alias na rovnaký deployment

Middleware automaticky detekuje tenant z domény.

## 📊 Monitoring

### Vercel Analytics

1. **Analytics** tab v dashboard
2. Automaticky sleduje:
   - Page views
   - Performance metrics
   - Real User Monitoring (RUM)

### Logs

1. **Deployments** → vyber deployment
2. **Functions** tab pre serverless function logs
3. **Runtime Logs** pre runtime errors

## 🎯 Next Steps

Po úspešnom deploymente:

1. ✅ Testuj všetky funkcionality
2. ✅ Nastav custom domény (ak máš)
3. ✅ Skontroluj performance v Analytics
4. ✅ Nastav monitoring alerts (voliteľné)

## 📚 Užitočné Linky

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

✅ **Hotovo!** Frontend je nasadený na Vercel!

