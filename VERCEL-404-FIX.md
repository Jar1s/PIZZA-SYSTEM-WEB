# 🔧 Oprava 404 Chyby na Vercel

## ❌ Problém: 404 NOT_FOUND

Ak vidíš 404 chybu na Vercel, môže to byť spôsobené:

1. **Root Directory nie je správne nastavený**
2. **Build zlyhal**
3. **Problém s Next.js routing**

## ✅ Riešenie

### Krok 1: Skontroluj Root Directory

1. **Choď na Vercel dashboard**
2. **Vyber tvoj projekt**
3. **Choď na Settings → General**
4. **Skontroluj Root Directory:**
   - Mala by byť: `frontend`
   - **NIE** prázdne!
   - **NIE** `./frontend`!

### Krok 2: Skontroluj Build Logs

1. **Choď na Deployments tab**
2. **Klikni na najnovší deployment**
3. **Skontroluj Build Logs:**
   - Hľadaj chyby (červený text)
   - Skontroluj, či build prešiel úspešne

### Krok 3: Skontroluj, Či Stránky Existujú

Stránky by mali existovať:
- ✅ `/admin` → `frontend/app/admin/page.tsx`
- ✅ `/login` → `frontend/app/login/page.tsx`
- ✅ `/` → `frontend/app/page.tsx`

### Krok 4: Redeploy

1. **Ak Root Directory nie je správne:**
   - Zmeň Root Directory na `frontend`
   - Klikni "Save"
   - Vercel automaticky redeployuje

2. **Ak build zlyhal:**
   - Skontroluj Build Logs
   - Oprav chyby
   - Pushni zmeny na GitHub
   - Vercel automaticky redeployuje

## 🔍 Troubleshooting

### Problém: Root Directory je prázdne
**Riešenie:** Nastav na `frontend`

### Problém: Build zlyhá
**Riešenie:** Skontroluj Build Logs a oprav chyby

### Problém: Stránky neexistujú
**Riešenie:** Skontroluj, či sú súbory v `frontend/app/` priečinku

### Problém: Middleware blokuje prístup
**Riešenie:** Skontroluj `frontend/middleware.ts` - nemal by blokovať `/admin` alebo `/login`

## ✅ Očakávaný Výsledok

Po oprave:
- ✅ `/admin` by mal fungovať
- ✅ `/login` by mal fungovať
- ✅ `/` by mal fungovať

## 🆘 Ak Stále Ne Funguje

1. **Skontroluj Vercel Build Logs** - hľadaj chyby
2. **Skontroluj Root Directory** - musí byť `frontend`
3. **Skontroluj, či sú súbory pushnuté na GitHub**
4. **Skús manuálny redeploy**


