# 🚀 Prvý Deployment na Vercel

## ❌ Problém: "No Results" v Deployments

Ak vidíš "No Results" v Deployments tab, znamená to, že ešte nebol vytvorený žiadny deployment.

## ✅ Riešenie: Vytvor Prvý Deployment

### Krok 1: Vymaž Filtre
1. Klikni na **"Clear Filters"** (modrý text pod "No Results")
2. Toto zobrazí všetky deploymenty (ak nejaké existujú)

### Krok 2: Skontroluj, Či Je Projekt Pripojený
1. Choď na **Settings** → **Git**
2. Skontroluj, či je repository pripojené:
   - Mala by byť: `Jar1s/PIZZA-SYSTEM-WEB`
   - Branch: `main`
3. Ak nie je pripojené, pripoj ho

### Krok 3: Vytvor Prvý Deployment

#### Možnosť A: Automatický Deployment (Odporúčané)
1. Choď na **Settings** → **Git**
2. Skontroluj **Production Branch**:
   - Mala by byť: `main`
3. Vercel by mal automaticky vytvoriť deployment pri pushnutí
4. Ak sa to nedeje, skús **Možnosť B**

#### Možnosť B: Manuálny Deployment
1. Klikni na tlačidlo **"Create Deployment"** (pravý horný roh)
2. V input fielde zadaj: `50a8550` (commit hash)
3. Klikni **"Create Deployment"**

#### Možnosť C: Push do GitHub (Ak ešte nie je)
```bash
# Skontroluj, či sú zmeny pushnuté
git status

# Ak nie sú, pushni ich
git push origin main
```

### Krok 4: Skontroluj Build Settings
1. Choď na **Settings** → **General**
2. Skontroluj:
   - **Root Directory:** `frontend` ✅
   - **Framework Preset:** `Next.js` ✅
   - **Build Command:** `npm run build` (alebo prázdne) ✅
   - **Output Directory:** `.next` (alebo prázdne) ✅

### Krok 5: Skontroluj Environment Variables
1. Choď na **Settings** → **Environment Variables**
2. Skontroluj, či existuje:
   - `NEXT_PUBLIC_API_URL` = `https://pizza-system-web.onrender.com`
3. Ak nie, pridaj ho

## 🔧 Ak Stále "No Results"

### Skontroluj:
1. ✅ Je projekt správne pripojený k GitHub?
2. ✅ Je Root Directory nastavený na `frontend`?
3. ✅ Sú nastavené environment variables?
4. ✅ Je Framework Preset nastavený na Next.js?

### Alternatíva: Vytvor Nový Projekt
Ak nič nefunguje, môžeš vytvoriť nový projekt:
1. Choď na **Dashboard**
2. Klikni **"Add New..."** → **"Project"**
3. Vyber repository: `Jar1s/PIZZA-SYSTEM-WEB`
4. **DÔLEŽITÉ:** Nastav **Root Directory** na `frontend`
5. Pridaj environment variable: `NEXT_PUBLIC_API_URL=https://pizza-system-web.onrender.com`
6. Klikni **"Deploy"**

## 📊 Po Úspešnom Deploymente

Po vytvorení deploymentu:
1. ✅ V Deployments tab sa zobrazí nový deployment
2. ✅ Klikni na neho pre build logs
3. ✅ Po dokončení dostaneš URL: `https://your-project.vercel.app`


