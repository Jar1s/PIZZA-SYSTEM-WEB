# 🚀 Vercel Deployment Tip

## Automatický Deployment (Odporúčané)

Vercel automaticky vytvára deployment pri každom push do `main` branch. 

**Ak sme práve pushli zmeny:**
- Počkaj 1-2 minúty
- Vercel automaticky vytvorí nový deployment
- Skontroluj **Deployments** tab v Vercel dashboard

## Manuálny Deployment

Ak chceš vytvoriť manuálny deployment:

### Možnosť 1: Použi Branch Name
V input fielde zadaj:
```
main
```

### Možnosť 2: Použi Commit Hash
V input fielde zadaj commit hash (napr.):
```
50a8550
```
alebo plný hash:
```
50a8550a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### Možnosť 3: Klikni na "main" Button
Klikni na tlačidlo s textom "main" pod input fieldom - automaticky vyplní branch name.

## ⚠️ Dôležité

**NEPOUŽÍVAJ:**
- ❌ `https://github.com/Jar1s/PIZZA-SYSTEM-WEB` (URL repozitára)
- ❌ `github.com/Jar1s/PIZZA-SYSTEM-WEB` (URL bez protokolu)

**POUŽI:**
- ✅ `main` (branch name)
- ✅ `50a8550` (commit hash)
- ✅ `HEAD` (najnovší commit)

## 📊 Sledovanie Deploymentu

Po vytvorení deploymentu:
1. Choď na **Deployments** tab
2. Klikni na nový deployment
3. Sleduj **Build Logs** pre progress
4. Po dokončení skontroluj **Runtime Logs** pre chyby

## ✅ Úspešný Deployment

Po úspešnom deploymente:
- Dostaneš URL: `https://your-project.vercel.app`
- Testuj: `https://your-project.vercel.app?tenant=pornopizza`
- Skontroluj, či sa načítajú produkty z API

