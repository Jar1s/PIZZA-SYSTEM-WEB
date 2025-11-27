# 🚀 Production Deployment: Weight & Allergens

## ✅ Čo bolo urobene

1. ✅ **Prisma Schema** - pridané `weightGrams` a `allergens`
2. ✅ **Backend Service** - vracia `weightGrams` a `allergens` z databázy
3. ✅ **Frontend** - používa dáta z databázy s fallbackom
4. ✅ **Prisma Migrácia** - vytvorená a pushnutá do GitHub
5. ✅ **Git Push** - zmeny sú na `main` branch

## 🔄 Automatický Deployment

### Render.com (Backend)
- ✅ **Auto-deploy je zapnutý** - Render automaticky redeployuje pri push do `main`
- ⏳ **Čaká sa na build** - Render práve buildí novú verziu
- ⚠️ **Dôležité:** Po deploymente musíte spustiť migráciu!

### Vercel (Frontend)
- ✅ **Auto-deploy je zapnutý** - Vercel automaticky redeployuje pri push do `main`
- ⏳ **Čaká sa na build** - Vercel práve buildí novú verziu

## 📋 Čo treba urobiť na produkcii

### KROK 1: Spustiť migráciu na Render.com

Po tom, ako Render dokončí deployment:

1. **Otvorte Render Dashboard**: https://dashboard.render.com
2. **Nájdite svoj backend service** (napr. `pizza-ecosystem-api`)
3. **Kliknite na "Shell"** (alebo "SSH" ak je dostupné)
4. **Spustite migráciu:**

```bash
cd backend
npx prisma migrate deploy
```

Alebo ak máte prístup cez SSH:

```bash
# V Render Shell
cd backend
npx prisma migrate deploy
```

**Poznámka:** Migrácia je idempotentná (bezpečná na opakované spustenie), takže ak stĺpce už existujú (z manuálneho SQL), migrácia ich len overí.

### KROK 2: Overenie

#### Skontrolujte backend API:

```bash
curl https://pizza-system-web.onrender.com/api/pornopizza/products | jq '.[] | select(.name=="Margherita") | {name, weightGrams, allergens}'
```

Malo by vrátiť:
```json
{
  "name": "Margherita",
  "weightGrams": 450,
  "allergens": ["1", "7"]
}
```

#### Skontrolujte frontend:

1. Otvorte: `https://your-frontend.vercel.app?tenant=pornopizza`
2. Nájdite pizzu (napr. Margherita)
3. Mala by sa zobraziť: `⚖️ 450g` a `1, 7`

## 🔍 Sledovanie Deploymentu

### Render.com
1. Choďte na: https://dashboard.render.com
2. Kliknite na váš backend service
3. Sledujte **"Events"** tab - uvidíte build progress
4. Po úspešnom deploymente uvidíte: ✅ "Deployed successfully"

### Vercel
1. Choďte na: https://vercel.com
2. Kliknite na váš projekt
3. Sledujte **"Deployments"** tab - uvidíte build progress
4. Po úspešnom deploymente uvidíte: ✅ "Ready"

## ⚠️ Dôležité poznámky

1. **Migrácia musí byť spustená** - bez migrácie Prisma Client nebude vedieť o nových stĺpcoch
2. **Stĺpce už existujú** - ak ste spustili SQL skript v Supabase, stĺpce už sú v databáze
3. **Migrácia je idempotentná** - môžete ju spustiť viackrát bez chyby
4. **Frontend sa aktualizuje automaticky** - po Vercel deploymente by malo všetko fungovať

## 🐛 Riešenie problémov

### Backend nezačína po deploymente

**Riešenie:**
1. Skontrolujte **Logs** v Render dashboard
2. Skontrolujte, či je `DATABASE_URL` správne nastavený
3. Skontrolujte, či Prisma Client je vygenerovaný (`npx prisma generate` v build commande)

### Frontend nezobrazuje gramáž a alergény

**Riešenie:**
1. Skontrolujte, či backend vracia `weightGrams` a `allergens` v API response
2. Skontrolujte konzolu prehlíadača pre chyby
3. Skontrolujte Network tab - či API response obsahuje nové polia

### Migrácia zlyhá

**Riešenie:**
- Migrácia používa `IF NOT EXISTS`, takže by nemala zlyhať
- Ak zlyhá, skontrolujte, či máte správne oprávnenia v databáze
- Skontrolujte Render logs pre detailnú chybovú správu

## ✅ Checklist

- [ ] Render deployment dokončený
- [ ] Migrácia spustená na Render.com (`npx prisma migrate deploy`)
- [ ] Backend API vracia `weightGrams` a `allergens`
- [ ] Vercel deployment dokončený
- [ ] Frontend zobrazuje gramáž a alergény z databázy
- [ ] Testované na produkčnom webe

## 📊 Verifikácia v Supabase

Môžete skontrolovať, či sú dáta správne v databáze:

```sql
SELECT 
  name,
  "weightGrams",
  allergens,
  ("priceCents"::float / 100)::numeric(10,2) as price_eur
FROM products 
WHERE "tenantId" = (SELECT id FROM tenants WHERE subdomain = 'pornopizza')
  AND category = 'PIZZA'
ORDER BY name
LIMIT 10;
```

Malo by vrátiť produkty s `weightGrams` a `allergens` hodnotami.

