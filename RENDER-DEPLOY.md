# 🚀 Deploy na Render.com

## Backend Deployment

### Krok 1: Vytvoriť Web Service na Render.com

1. **Prihlás sa do Render.com**: https://dashboard.render.com
2. **Klikni na "New +"** → **"Web Service"**
3. **Pripoj GitHub repository** (alebo iný Git provider)
4. **Vyber branch** (zvyčajne `main` alebo `master`)

### Krok 2: Konfigurácia

**Service Name:** `pizza-ecosystem-api`

**Environment:** `Node`

**Region:** `Frankfurt` (alebo najbližšia k tvojej databáze)

**Branch:** `main` (alebo tvoj default branch)

**Root Directory:** `backend`

**Build Command:**
```bash
npm ci && npm run build
```

**Start Command:**
```bash
npm run start:prod
```

### Krok 3: Environment Variables

Nastav tieto environment variables v Render dashboard:

#### Povinné:
- `NODE_ENV` = `production`
- `PORT` = `10000` (Render automaticky nastaví PORT, ale môžeš ho explicitne nastaviť)
- `DATABASE_URL` = `postgresql://postgres.gsawehudurchkeysdqhm:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres` (Session Pooler - IPv4 kompatibilný)
- `JWT_SECRET` = `0ax6regUYrpZssgHfuL3WkSAnCWjDgNYx8B/MLuUyTA=`
- `JWT_REFRESH_SECRET` = `l6lvL9RLeSSXi8CjuEHzElIxzh03lLVpEaBkFuprD64=`

#### Voliteľné:
- `ALLOWED_ORIGINS` = `https://your-frontend.onrender.com,https://pornopizza.sk`
- `SENTRY_DSN` = (ak používaš Sentry)
- `GOOGLE_CLIENT_ID` = (pre Google OAuth - pozri `RENDER-GOOGLE-OAUTH-SETUP.md`)
- `GOOGLE_CLIENT_SECRET` = (pre Google OAuth - pozri `RENDER-GOOGLE-OAUTH-SETUP.md`)
- `GOOGLE_REDIRECT_URI` = `https://pizza-system-web.onrender.com/api/auth/customer/google/callback` (voliteľné - má default)
- `BACKEND_URL` = `https://pizza-system-web.onrender.com` (voliteľné - má default)
- `FRONTEND_URL` = `https://your-frontend.vercel.app` (voliteľné - má default)

### Krok 4: Health Check

Render automaticky skontroluje `/api/health` endpoint.

### Krok 5: Deploy

1. **Klikni na "Create Web Service"**
2. Render začne build proces
3. Po úspešnom buildi sa služba automaticky spustí

---

## Alternatíva: Použitie render.yaml

Ak chceš použiť `render.yaml` (infraštruktúra ako kód):

1. **V Render dashboard:**
   - Klikni na "New +" → "Blueprint"
   - Pripoj repository
   - Render automaticky detekuje `render.yaml` a vytvorí služby

2. **Alebo manuálne:**
   - Vytvor Web Service
   - Render použije konfiguráciu z `render.yaml`

---

## Prisma Migrácie

Po prvom deployi spusti migrácie:

```bash
# V Render dashboard → Shell
cd backend
npx prisma migrate deploy
npx prisma db seed
```

Alebo môžeš pridať do build commandu:
```bash
npm ci && npm run build && npx prisma migrate deploy
```

---

## Troubleshooting

### Prisma Engine Error
Ak vidíš OpenSSL error, uisti sa, že `backend/prisma/schema.prisma` má:
```prisma
binaryTargets = ["linux-musl-openssl-3.0.x"]
```

### Port Error
Render automaticky nastaví `PORT` environment variable. Uisti sa, že `backend/src/main.ts` používa:
```typescript
const port = process.env.PORT || 3000;
```

### Build Fails
Skontroluj logy v Render dashboard. Bežné problémy:
- Chýbajúce environment variables
- Nesprávne cesty v build commande
- Prisma generate zlyhá

---

## URL

Po úspešnom deployi bude backend dostupný na:
```
https://pizza-ecosystem-api.onrender.com
```

Alebo vlastná doména, ak ju nastavíš v Render dashboard.

---

## Monitoring

- **Logs:** Render dashboard → Tvoja služba → "Logs"
- **Metrics:** Render dashboard → Tvoja služba → "Metrics"
- **Health Checks:** Automaticky na `/api/health`

---

## Auto-Deploy

Render automaticky redeployuje pri push do pripojeného branchu.

Ak chceš vypnúť auto-deploy:
- Render dashboard → Tvoja služba → Settings → "Auto-Deploy" → OFF

