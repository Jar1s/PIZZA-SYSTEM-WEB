# 🔧 Oprava Vercel Cache Problémů

## Problémy
1. **Cannot find module 'zod'** - Zod není v node_modules
2. **PrismaClientInitializationError** - Prisma Client se negeneruje

## Řešení

### 1. Vymazat Vercel Build Cache

V **Vercel Dashboard**:
1. Otevři projekt **backend**
2. Jdi na **Settings** → **General**
3. Scroll dolů na **Build & Development Settings**
4. Klikni na **Clear Build Cache**
5. Potvrď vymazání cache

### 2. Manuální Redeploy bez Cache

V **Vercel Dashboard**:
1. Otevři projekt **backend**
2. Jdi na **Deployments**
3. Klikni na **...** (tři tečky) u posledního deploymentu
4. Vyber **Redeploy**
5. **DŮLEŽITÉ:** Odškrtni **"Use existing Build Cache"**
6. Klikni **Redeploy**

### 3. Zkontrolovat Environment Variables

V **Vercel Dashboard** → **Settings** → **Environment Variables**:

Ujisti se, že máš:
- `DATABASE_URL` - Supabase connection string
- `NODE_ENV=production`
- `ALLOWED_ORIGINS` (volitelné, protože `.vercel.app` origins jsou povoleny automaticky)

### 4. Zkontrolovat Build Logs

Po redeployi zkontroluj **Build Logs**:
1. Otevři deployment
2. Klikni na **Build Logs**
3. Hledej:
   - `Running "npm install && npx prisma generate"` ✅
   - `Running "npm run prisma:generate && npm run build"` ✅
   - `Generated Prisma Client` ✅

### 5. Pokud to stále nefunguje

Zkus přidat do `vercel.json`:

```json
{
  "version": 2,
  "buildCommand": "npm run prisma:generate && npm run build",
  "installCommand": "npm ci && npx prisma generate",
  "outputDirectory": "dist",
  "framework": null,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "api/index.ts": {
      "includeFiles": "prisma/**"
    }
  }
}
```

## Ověření

Po redeployi zkontroluj:
1. **Build Logs** - měly by být vidět `prisma generate` a `zod` instalace
2. **Runtime Logs** - neměly by být chyby `Cannot find module 'zod'` nebo `PrismaClientInitializationError`
3. **API Endpoint** - zkus `https://backend-*.vercel.app/api/health`

## Poznámka

Vercel cache může způsobit, že staré deploymenty používají staré node_modules. Vždy po změnách v `package.json` nebo `prisma/schema.prisma` je dobré vymazat cache.

