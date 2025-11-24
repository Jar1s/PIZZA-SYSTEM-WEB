# 🔧 Oprava Načítania Assetov na Custom Doméne

## ❌ Problém

Na custom doméne `https://www.p0rnopizza.sk/` bol rozhodený dizajn (CSS/JS sa nenačítavali správne), zatiaľ čo na Vercel subdoméne `https://pizza-system-web.vercel.app/` všetko fungovalo správne.

## 🔍 Príčina

Problém bol v `frontend/app/layout.tsx`, kde sa používala statická hodnota `process.env.NEXT_PUBLIC_BASE_URL` s defaultom `http://localhost:3001`. To spôsobovalo, že:

1. **Metadata a canonical URL** používali nesprávny base URL
2. **Next.js assety** (`/_next/static/...`) by mali byť automaticky relatívne, ale metadata používali nesprávne URL

## ✅ Riešenie

Upravil som `frontend/app/layout.tsx` aby **dynamicky detekoval base URL** z request headers namiesto použitia environment variable:

```typescript
// Pred:
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

// Po:
const hostname = headersList.get('host') || '';
const protocol = headersList.get('x-forwarded-proto') || 'https';
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${hostname}`;
```

### Čo sa zmenilo:

1. **Dynamická detekcia hostname** - z request headers
2. **Dynamická detekcia protokolu** - z `x-forwarded-proto` header (HTTPS na produkcii)
3. **Fallback na environment variable** - ak je `NEXT_PUBLIC_BASE_URL` nastavený, použije sa
4. **Automatická detekcia** - na custom doméne sa automaticky použije správny URL

## 📝 Zmeny v Súboroch

### `frontend/app/layout.tsx`

- ✅ `generateMetadata()` - dynamická detekcia base URL
- ✅ `RootLayout()` - dynamická detekcia base URL

## 🚀 Ďalšie Kroky

### 1. Redeploy na Vercel

Zmeny sa prejavia po redeploy:

```bash
# Pushni zmeny na GitHub
git add frontend/app/layout.tsx
git commit -m "Fix: Dynamic base URL detection for custom domains"
git push

# Vercel automaticky redeployuje
```

### 2. Skontroluj Environment Variables (Voliteľné)

V Vercel Dashboard → Settings → Environment Variables:

- `NEXT_PUBLIC_API_URL` = `https://pizza-system-web.onrender.com`
- `NEXT_PUBLIC_BASE_URL` = **NEPOVINNÉ** (teraz sa detekuje automaticky)

**Poznámka:** `NEXT_PUBLIC_BASE_URL` už nie je povinný, ale môžeš ho nastaviť pre explicitnú kontrolu.

### 3. Testovanie

Po redeploy skontroluj:

1. **Custom doména:** `https://www.p0rnopizza.sk/`
   - ✅ CSS sa načítava správne
   - ✅ JavaScript funguje
   - ✅ Dizajn je správny

2. **Vercel subdoména:** `https://pizza-system-web.vercel.app/`
   - ✅ Stále funguje správne

3. **Developer Tools:**
   - Otvor F12 → Network tab
   - Skontroluj, či sa `/_next/static/...` súbory načítavajú (status 200)
   - Skontroluj Console, či nie sú chyby

## 🔍 Technické Detaily

### Ako to funguje:

1. **Request príde na custom doménu** (`www.p0rnopizza.sk`)
2. **Next.js middleware** detekuje tenant z hostname
3. **Layout komponent** dostane request headers
4. **Dynamicky detekuje:**
   - `host` header → `www.p0rnopizza.sk`
   - `x-forwarded-proto` header → `https`
5. **Vytvorí base URL:** `https://www.p0rnopizza.sk`
6. **Použije ho pre metadata** (canonical URL, Open Graph, atď.)

### Prečo to funguje:

- Next.js automaticky generuje **relatívne cesty** k assetom (`/_next/static/...`)
- Tieto cesty fungujú na **akomkoľvek doméne**
- Problém bol len v **metadata**, ktoré používali nesprávny base URL
- Teraz sa base URL **automaticky detekuje** z request headers

## ⚠️ Dôležité Poznámky

1. **Middleware matcher** už správne vylučuje `_next/static` a `_next/image`, takže assety nie sú blokované
2. **CSP (Content Security Policy)** v `next.config.js` je len pre SVG obrázky, nie pre CSS/JS
3. **Vercel automaticky** poskytuje správne headers (`x-forwarded-proto`, `host`)

## 🆘 Troubleshooting

### Problém: Stále rozhodený dizajn

**Riešenie:**
1. Skontroluj, či boli zmeny pushnuté na GitHub
2. Skontroluj, či Vercel redeployoval projekt
3. Vymaž cache v prehliadači (Ctrl+Shift+R)
4. Skontroluj Developer Tools → Network tab

### Problém: Assety sa nenačítavajú

**Riešenie:**
1. Skontroluj, či middleware neblokuje assety (mal by vylučovať `_next/static`)
2. Skontroluj, či DNS záznamy sú správne
3. Skontroluj, či SSL certifikát je platný

### Problém: Metadata používajú nesprávny URL

**Riešenie:**
- Nastav `NEXT_PUBLIC_BASE_URL` v Vercel environment variables pre explicitnú kontrolu

## ✅ Checklist

- [x] Upravený `layout.tsx` pre dynamickú detekciu base URL
- [ ] Zmeny pushnuté na GitHub
- [ ] Vercel redeployovaný
- [ ] Testované na custom doméne
- [ ] Testované na Vercel subdoméne
- [ ] Skontrolované v Developer Tools

---

✅ **Hotovo!** Po redeploy by malo všetko fungovať správne na custom doméne.

