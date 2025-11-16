# OAuth Cookies Setup Guide

## Problém: Cookies sa neukladajú po Google/Apple prihlásení

Ak po kliknutí na "Continue" v Google/Apple prihlásení ste znova presmerovaní na login obrazovku, znamená to, že frontend nedostal tokeny z `/auth/oauth-callback`.

## Príčiny

### 1. Nesprávne `FRONTEND_URL` / `OAUTH_COOKIE_DOMAIN`

**Problém:** Ak v prostredí stále beží default `http://localhost:3001`, backend nastaví cookies pre `localhost` a pri reálnom doméne (napr. `pornopizza.sk`) ich prehliadač zmaže.

**Riešenie:**
```bash
# Pre production
FRONTEND_URL=https://pornopizza.sk
# alebo
FRONTEND_URL=https://www.pornopizza.sk

# Explicitne nastav cookie domain (s bodkou na začiatku!)
OAUTH_COOKIE_DOMAIN=.pornopizza.sk
```

**Dôležité:** Domain musí začínať bodkou (`.pornopizza.sk`) pre podporu subdomén (`www.pornopizza.sk`, `api.pornopizza.sk`).

### 2. Nesedí `GOOGLE_REDIRECT_URI` s Google Console

**Problém:** `GOOGLE_REDIRECT_URI` musí byť identická s autorizovanou URL v Google Cloud Console.

**Riešenie:**
```bash
# Pre production
GOOGLE_REDIRECT_URI=https://api.pornopizza.sk/api/auth/customer/google/callback
BACKEND_URL=https://api.pornopizza.sk
```

**Skontroluj v Google Cloud Console:**
1. Otvoriť [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Nájsť OAuth 2.0 Client ID
4. Skontrolovať "Authorized redirect URIs"
5. Musí tam byť presne: `https://api.pornopizza.sk/api/auth/customer/google/callback`

### 3. HTTP vs. HTTPS

**Problém:** Cookies sa ukladajú s `secure: true` v produkcii. Ak voláš backend cez HTTP (napr. na staginge bez TLS), prehliadač tieto cookies odmietne.

**Riešenie:**
- V production vždy používaj HTTPS
- Pre staging s HTTP nastav `NODE_ENV=development` (alebo uprav kód)

## Postup nastavenia

### Krok 1: Nastav environment premenné

```bash
# Backend .env
NODE_ENV=production
FRONTEND_URL=https://pornopizza.sk
BACKEND_URL=https://api.pornopizza.sk
GOOGLE_REDIRECT_URI=https://api.pornopizza.sk/api/auth/customer/google/callback
OAUTH_COOKIE_DOMAIN=.pornopizza.sk  # S bodkou!

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Krok 2: Skontroluj Google Console

1. Otvoriť [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Nájsť OAuth 2.0 Client ID
4. Skontrolovať "Authorized redirect URIs":
   - ✅ `https://api.pornopizza.sk/api/auth/customer/google/callback`
   - ❌ `http://localhost:3000/api/auth/customer/google/callback` (len pre dev)

### Krok 3: Reštartuj backend

```bash
# Po zmene env premenných
pm2 restart backend
# alebo
npm run start:prod
```

### Krok 4: Test v prehliadači

1. Otvoriť DevTools → Network
2. Kliknúť na "Continue" v Google prihlásení
3. Sledovať odpoveď z `/api/auth/customer/google/callback`
4. Skontrolovať **Response Headers** - mali by tam byť:
   ```
   Set-Cookie: oauth_access_token=...; Domain=.pornopizza.sk; Path=/; Secure; SameSite=Lax
   Set-Cookie: oauth_refresh_token=...; Domain=.pornopizza.sk; Path=/; Secure; SameSite=Lax
   Set-Cookie: oauth_user_data=...; Domain=.pornopizza.sk; Path=/; Secure; SameSite=Lax
   ```

5. Skontrolovať **Application → Cookies** - mali by tam byť cookies pre `pornopizza.sk`:
   - `oauth_access_token`
   - `oauth_refresh_token`
   - `oauth_user_data`

### Krok 5: Skontroluj backend logy

Backend by mal logovať:
```
OAuth cookie options: {
  domain: '.pornopizza.sk',
  secure: true,
  sameSite: 'lax',
  path: '/',
  frontendUrl: 'https://pornopizza.sk',
  isProduction: true
}
Setting OAuth cookies with options: { ... }
OAuth cookies set successfully
```

## Debugging

### Cookies sa neukladajú

1. **Skontroluj domain:**
   ```bash
   # V backend logoch by malo byť:
   domain: '.pornopizza.sk'  # S bodkou!
   ```

2. **Skontroluj secure:**
   - Ak používaš HTTP, cookies sa neuložia (secure: true)
   - Použi HTTPS alebo nastav `NODE_ENV=development`

3. **Skontroluj frontend URL:**
   ```bash
   # FRONTEND_URL musí byť presne tá doména, kde beží frontend
   FRONTEND_URL=https://pornopizza.sk  # ✅
   FRONTEND_URL=http://localhost:3001  # ❌ (pre production)
   ```

### Frontend nevidí cookies

1. **Skontroluj, že cookies sú v správnej doméne:**
   - DevTools → Application → Cookies
   - Cookies musia byť pre `pornopizza.sk` (nie `api.pornopizza.sk`)

2. **Skontroluj, že `httpOnly: false`:**
   - Frontend potrebuje čítať `oauth_user_data`
   - V kóde je `httpOnly: false` pre všetky OAuth cookies

3. **Skontroluj CORS:**
   - Backend musí mať povolené credentials
   - Frontend musí posielať credentials v fetch

## Vývoj vs. Produkcia

### Development (localhost)

```bash
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3000
```

**Správanie:**
- Tokens sa posielajú v URL parametroch (nie cookies)
- Frontend ich číta z URL a ukladá do localStorage
- Funguje aj medzi `localhost:3000` a `localhost:3001`

### Production

```bash
NODE_ENV=production
FRONTEND_URL=https://pornopizza.sk
BACKEND_URL=https://api.pornopizza.sk
OAUTH_COOKIE_DOMAIN=.pornopizza.sk
```

**Správanie:**
- Tokens sa posielajú v cookies
- Cookies majú domain `.pornopizza.sk` (s bodkou)
- Cookies majú `secure: true` (len HTTPS)
- Frontend ich číta z cookies a ukladá do localStorage

## Zhrnutie

✅ **Nastav správne env premenné:**
- `FRONTEND_URL` = skutočná frontend doména
- `OAUTH_COOKIE_DOMAIN` = `.pornopizza.sk` (s bodkou!)
- `GOOGLE_REDIRECT_URI` = presne ako v Google Console

✅ **Skontroluj Google Console:**
- Authorized redirect URI musí sedieť

✅ **Reštartuj backend:**
- Po zmene env premenných

✅ **Testuj v DevTools:**
- Network → Response Headers → Set-Cookie
- Application → Cookies

✅ **Používaj HTTPS v production:**
- Cookies s `secure: true` fungujú len cez HTTPS

