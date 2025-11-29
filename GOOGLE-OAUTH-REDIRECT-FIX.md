# 🔧 Oprava Google OAuth Redirect - "Site cannot be reached"

## Problém:
Po kliknutí na "Continue" v Google OAuth vidíš chybu:
```
This site can't be reached
localhost refused to connect
ERR_CONNECTION_REFUSED
```

## Príčina:
Google OAuth redirect URI nie je správne nastavený. Google sa pokúša redirectovať na `http://localhost:3000` namiesto produkčného backend URL.

## ✅ Riešenie:

### Krok 1: Skontroluj Google Cloud Console

1. **Choď na [Google Cloud Console](https://console.cloud.google.com/)**
2. **APIs & Services** → **Credentials**
3. **Nájsť tvoj OAuth 2.0 Client ID**
4. **Klikni na "Edit"**
5. **Skontroluj "Authorized redirect URIs"**

**Musí tam byť presne:**
```
https://pizza-system-web.onrender.com/api/auth/customer/google/callback
```

**NIE:**
- ❌ `http://localhost:3000/api/auth/customer/google/callback` (pre production)
- ❌ `https://localhost:3000/api/auth/customer/google/callback`
- ❌ `http://pizza-system-web.onrender.com/api/auth/customer/google/callback` (bez https)

### Krok 2: Nastav Environment Variables na Render.com

1. **Render Dashboard** → **Tvoj backend service** → **Environment**
2. **Skontroluj alebo pridaj:**

```
BACKEND_URL=https://pizza-system-web.onrender.com
GOOGLE_REDIRECT_URI=https://pizza-system-web.onrender.com/api/auth/customer/google/callback
FRONTEND_URL=https://www.p0rnopizza.sk
```

**Dôležité:**
- `BACKEND_URL` musí byť **bez trailing slash**
- `GOOGLE_REDIRECT_URI` musí byť **presne** ako v Google Console
- `FRONTEND_URL` musí byť tvoja skutočná frontend doména

### Krok 3: Redeploy Backend

1. **Render Dashboard** → **Manual Deploy** → **Deploy latest commit**
2. **Počkaj 2-3 minúty** na dokončenie

### Krok 4: Testuj

1. **Choď na frontend**: `https://www.p0rnopizza.sk/auth/login`
2. **Klikni na "Sign in with Google"**
3. **Vyber Google účet a klikni "Continue"**
4. **Malo by ťa presmerovať späť na frontend** (nie na localhost)

## 🔍 Troubleshooting

### Ak stále vidíš "localhost refused to connect":

1. **Skontroluj Google Console:**
   - Authorized redirect URIs musí obsahovať **len** produkčný URL
   - Odstráň `http://localhost:3000` ak tam je

2. **Skontroluj Render.com Environment:**
   - `BACKEND_URL` = `https://pizza-system-web.onrender.com`
   - `GOOGLE_REDIRECT_URI` = `https://pizza-system-web.onrender.com/api/auth/customer/google/callback`

3. **Skontroluj backend logs na Render.com:**
   - Hľadaj chyby s "redirect_uri_mismatch"
   - Skontroluj, aký redirect URI backend používa

### Ak vidíš "redirect_uri_mismatch":

To znamená, že redirect URI v Google Console **nezhoduje** s tým, čo backend posiela.

**Riešenie:**
1. Skopíruj presný redirect URI z backend logs
2. Pridaj ho do Google Console → Authorized redirect URIs
3. Alebo nastav `GOOGLE_REDIRECT_URI` v Render.com na presne ten istý URL

## 📝 Poznámka

- **Development:** Používaj `http://localhost:3000/api/auth/customer/google/callback`
- **Production:** Používaj `https://pizza-system-web.onrender.com/api/auth/customer/google/callback`
- **NIKDY nemiešaj** development a production URLs v Google Console




