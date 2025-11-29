# 🔄 Migrácia z Vercel/Fly.io na Render.com

## ✅ Vymazané súbory

### Vercel:
- `backend/vercel.json`
- `frontend/vercel.json`
- `backend/vercel-build.sh`
- `backend/test-vercel-endpoints.js`
- `VERCEL-ENV-QUICK-SETUP.md`
- `VERCEL-ENV-VALUES.md`
- `VERCEL-FIX-CACHE.md`
- `FRONTEND-VERCEL-SETUP.md`
- `backend/VERCEL-ENV-SETUP.md`
- `VERCEL-DEPLOYMENT-PROTECTION.md`
- `PRISMA-VERCEL-FIX.md`
- `VERCEL-SUPABASE-SETUP.md`
- `VERCEL-DEPLOY-GUIDE.md`

### Fly.io:
- `fly.toml`
- `backend/fly.toml`
- `deploy-fly.sh`
- `FLY-DEPLOY-FROM-ROOT.md`
- `DEPLOY-FLY-IO-INSTEAD.md`

## ✅ Nové súbory

### Render.com:
- `render.yaml` - Konfigurácia pre Render.com
- `RENDER-DEPLOY.md` - Kompletná dokumentácia pre deployment
- `MIGRATION-TO-RENDER.md` - Tento súbor

## 📋 Ďalšie kroky

1. **Vytvor účet na Render.com**: https://render.com
2. **Pripoj GitHub repository**
3. **Vytvor Web Service** podľa `RENDER-DEPLOY.md`
4. **Nastav environment variables** (DATABASE_URL, JWT_SECRET, atď.)
5. **Deploy!**

## 🔧 Dôležité poznámky

- Render automaticky nastaví `PORT` environment variable
- Backend už používa `process.env.PORT || 3000` ✅
- Prisma schema má správne `binaryTargets` pre Render ✅
- Health check endpoint: `/api/health` ✅

## 📚 Dokumentácia

Pozri `RENDER-DEPLOY.md` pre detailné inštrukcie.





