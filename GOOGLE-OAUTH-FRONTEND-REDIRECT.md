# 🔄 Google OAuth Frontend Redirect - Update Guide

## ✅ Čo sa zmenilo

Google OAuth teraz používa **frontend redirect URI** namiesto backend redirect URI. To znamená, že Google zobrazí tvoju frontend doménu (napr. `p0rnopizza.sk`) v consent screen namiesto backend domény (napr. `pizza-system-web.onrender.com`).

## 📋 Čo treba urobiť

### 1. Aktualizuj Google Cloud Console

1. Choď na [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Klikni na tvoj **OAuth 2.0 Client ID**
4. V **Authorized redirect URIs** zmeň z:
   ```
   https://pizza-system-web.onrender.com/api/auth/customer/google/callback
   ```
   na:
   ```
   https://p0rnopizza.sk/auth/google/callback
   https://www.p0rnopizza.sk/auth/google/callback
   ```
   (prípadne aj `pornopizza.sk` ak ho používaš)

5. Klikni **Save**

### 2. Aktualizuj Environment Variables na Render.com

1. Choď na [Render Dashboard](https://dashboard.render.com/)
2. Vyber tvoj backend service
3. Choď na **Environment** tab
4. Aktualizuj alebo pridaj:
   ```
   GOOGLE_REDIRECT_URI=https://p0rnopizza.sk/auth/google/callback
   FRONTEND_URL=https://p0rnopizza.sk
   ```

5. Render automaticky redeployuje

### 3. Testuj

1. Po redeploymente klikni na "Sign in with Google"
2. V Google consent screen by sa malo zobraziť "to continue to p0rnopizza.sk" namiesto "pizza-system-web.onrender.com"
3. Po autorizácii by ťa malo presmerovať späť a prihlásiť

## 🔄 Ako to teraz funguje

1. User klikne "Sign in with Google"
2. Backend redirectuje na Google OAuth
3. Google zobrazí consent screen s **frontend doménou** (p0rnopizza.sk)
4. User autorizuje
5. Google redirectuje na **frontend** `/auth/google/callback?code=...`
6. Frontend pošle code na backend `/api/auth/customer/google/exchange`
7. Backend vráti tokens
8. Frontend uloží tokens a redirectuje na returnUrl

## ✅ Výhody

- ✅ Google consent screen zobrazuje tvoju doménu (nie backend)
- ✅ Lepšia UX - používatelia vidia známu doménu
- ✅ Bezpečnejšie - frontend callback je jednoduchší na validáciu

## 📝 Poznámky

- Backend endpoint `/api/auth/customer/google/callback` je stále dostupný pre backward compatibility
- Nový flow používa `/api/auth/customer/google/exchange` (POST endpoint)
- Frontend callback je na `/auth/google/callback`

