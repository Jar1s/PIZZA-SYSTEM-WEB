# 🔧 Prisma Vercel Fix - PrismaClientInitializationError

## Problém

```
PrismaClientInitializationError: Prisma has detected that this project was built on Vercel, 
which caches dependencies. This leads to an outdated Prisma Client because Prisma's 
auto-generation isn't triggered.
```

## Riešenie

### 1. Vercel Dashboard - Clear Build Cache

**DÔLEŽITÉ:** Toto je kľúčové!

1. Vercel Dashboard → Tvoj Projekt → **Settings** → **General**
2. Scroll dole na **Build & Development Settings**
3. Kliknúť **Clear Build Cache**
4. Potvrdiť vymazanie

### 2. Redeploy Bez Cache

1. Vercel Dashboard → **Deployments**
2. Kliknúť **...** (tri bodky) u posledného deploymentu
3. Vybrať **Redeploy**
4. **DÔLEŽITÉ:** Odškrtnúť **"Use existing Build Cache"**
5. Kliknúť **Redeploy**
6. Počkať 2-3 minúty

### 3. Skontrolovať Build Logs

Po redeployi skontrolovať **Build Logs**:

Malo by byť vidieť:
```
Running "npm run prisma:generate && npm run build"
...
Generated Prisma Client
...
```

### 4. Ak Stále Ne Funguje

#### Možnosť A: Pridať Environment Variable

Vercel Dashboard → Settings → Environment Variables:

```
Key: PRISMA_GENERATE_DATAPROXY
Value: false
Environment: Production, Preview
```

#### Možnosť B: Upraviť Build Command

V `vercel.json` je už správne nastavené:
```json
{
  "buildCommand": "npm run prisma:generate && npm run build",
  "installCommand": "npm ci --include=dev && npx prisma generate"
}
```

#### Možnosť C: Vymazať Všetky Caches

1. Vercel Dashboard → Settings → General → **Clear Build Cache**
2. Vercel Dashboard → Settings → General → **Clear Function Logs** (ak existuje)
3. Redeploy bez cache

---

## ✅ Očakávaný Výsledok

Po úspešnom deploymentu:
- ✅ Build Logs obsahujú `Generated Prisma Client`
- ✅ Runtime Logs neobsahujú `PrismaClientInitializationError`
- ✅ `/api/health` endpoint funguje
- ✅ `/api/tenants/pornopizza` endpoint funguje

---

## 📝 Poznámky

- **Prisma Client** sa musí generovať počas každého buildu
- **Vercel Cache** môže spôsobiť, že sa použije starý Prisma Client
- **Riešenie:** Vždy redeploy bez cache po zmene Prisma schema alebo po probléme s Prisma Client

---

## 🔍 Debugging

Ak problém pretrváva:

1. **Skontrolovať Build Logs:**
   - Hľadať `prisma generate`
   - Hľadať `Generated Prisma Client`
   - Hľadať chyby

2. **Skontrolovať Runtime Logs:**
   - Hľadať `PrismaClientInitializationError`
   - Hľadať `DATABASE_URL` errors

3. **Skontrolovať Environment Variables:**
   - `DATABASE_URL` je nastavené
   - `NODE_ENV=production`

4. **Testovať Lokálne:**
   ```bash
   cd backend
   npm run build
   # Skontrolovať, že dist obsahuje node_modules/.prisma
   ```

