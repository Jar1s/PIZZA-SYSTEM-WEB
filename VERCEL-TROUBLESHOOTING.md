# 🔧 Vercel Deployment Troubleshooting

## ❌ Problém: "main" nefunguje

Ak zadané "main" stále nefunguje, skús tieto riešenia:

## ✅ Riešenie 1: Použi Commit Hash

Namiesto "main" skús použiť commit hash:

### Krok 1: Získaj Commit Hash
Posledný commit hash je:
```
50a8550a20c4c089a9f89d0a8db248555adc145a
```

Alebo kratší:
```
50a8550
```

### Krok 2: Zadaj do Input Fieldu
1. Vymaž všetko z input fieldu
2. Zadaj: `50a8550`
3. Klikni "Create Deployment"

## ✅ Riešenie 2: Skontroluj Automatický Deployment

Vercel by mal automaticky vytvoriť deployment pri pushnutí do `main`.

### Krok 1: Skontroluj Deployments Tab
1. Choď na Vercel dashboard
2. Klikni na **"Deployments"** tab (vľavo)
3. Pozri sa, či tam už nie je deployment s commitom `50a8550`

### Krok 2: Ak Deployment Existuje
- Klikni na neho
- Sleduj build progress
- Po dokončení dostaneš URL

## ✅ Riešenie 3: Skontroluj Projekt Nastavenia

### Krok 1: Skontroluj Root Directory
1. Choď na **Settings** → **General**
2. Skontroluj **Root Directory**:
   - Mala by byť: `frontend`
   - Ak nie je, zmeň to

### Krok 2: Skontroluj Build Settings
1. Choď na **Settings** → **General**
2. Skontroluj **Build Command**:
   - Mala by byť: `npm run build`
   - Alebo prázdne (Vercel to detekuje automaticky)

### Krok 3: Skontroluj Framework
1. Skontroluj, či je **Framework Preset** nastavený na **Next.js**

## ✅ Riešenie 4: Vytvor Nový Deployment cez GitHub

### Krok 1: Choď na GitHub
1. Otvor repository: `Jar1s/PIZZA-SYSTEM-WEB`
2. Klikni na commit `50a8550`

### Krok 2: Použi Vercel GitHub Integration
1. Ak máš Vercel GitHub app nainštalovanú
2. Vercel by mal automaticky vytvoriť deployment pri pushnutí
3. Skontroluj **Deployments** tab v Vercel

## ✅ Riešenie 5: Redeploy Existujúci Deployment

Ak už existuje nejaký deployment:

### Krok 1: Nájdi Posledný Deployment
1. Choď na **Deployments** tab
2. Nájdi najnovší deployment

### Krok 2: Redeploy
1. Klikni na tri bodky (⋯) vedľa deploymentu
2. Klikni na **"Redeploy"**
3. Potvrď

## 🆘 Ak Nič Nepomôže

### Skontroluj:
1. ✅ Je projekt správne pripojený k GitHub repository?
2. ✅ Je Root Directory nastavený na `frontend`?
3. ✅ Sú nastavené environment variables (`NEXT_PUBLIC_API_URL`)?
4. ✅ Je Framework Preset nastavený na Next.js?

### Kontaktuj Support:
- Vercel má dobrý support - môžeš im napísať
















