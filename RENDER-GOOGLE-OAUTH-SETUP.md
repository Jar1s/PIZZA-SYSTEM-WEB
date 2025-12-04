# 🔐 Google OAuth Setup na Render.com

## ⚠️ Problém

Vidíš chybu:
```
Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in environment variables.
```

## ✅ Riešenie: Pridaj Environment Variables na Render.com

### Krok 1: Získaj Google OAuth Credentials

Ak ešte nemáš Google OAuth credentials:

1. **Choď na [Google Cloud Console](https://console.cloud.google.com/)**
2. **Vytvor nový projekt** alebo vyber existujúci
3. **Enable Google+ API** (alebo **Google Identity Services**)
4. **Choď na Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. **Nastav OAuth consent screen:**
   - User Type: External (pre verejné použitie)
   - App name: PornoPizza (alebo tvoj názov)
   - Authorized domains: `pornopizza.sk`, `pizzavnudzi.sk`
   - Scopes: `email`, `profile`, `openid`
6. **Vytvor OAuth 2.0 Client ID:**
   - Application type: **Web application**
   - Name: Pizza App OAuth Client
   - **Authorized redirect URIs:**
     - `https://pizza-system-web.onrender.com/api/auth/customer/google/callback`

7. **Skopíruj credentials:**
   - **Client ID** (napr. `123456789-abc.apps.googleusercontent.com`)
   - **Client Secret** (napr. `GOCSPX-abc123...`)

### Krok 2: Pridaj Environment Variables na Render.com

1. **Choď na Render.com dashboard**: https://dashboard.render.com
2. **Vyber tvoj backend service** (`pizza-ecosystem-api`)
3. **Choď na "Environment"** tab (vľavo v menu)
4. **Klikni na "Add Environment Variable"**
5. **Pridaj tieto premenné:**

#### Povinné:
```
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123...
```

#### Voliteľné (majú default hodnoty):
```
GOOGLE_REDIRECT_URI=https://pizza-system-web.onrender.com/api/auth/customer/google/callback
BACKEND_URL=https://pizza-system-web.onrender.com
FRONTEND_URL=https://your-frontend.vercel.app
```

### Krok 3: Redeploy

Po pridaní environment variables:

1. **Render automaticky redeployuje** (alebo klikni na "Manual Deploy" → "Deploy latest commit")
2. **Počkaj ~2-3 minúty** na dokončenie redeployu
3. **Testuj Google OAuth** na frontend

## ✅ Testovanie

Po redeploymente:

1. **Choď na frontend**: `https://your-frontend.vercel.app?tenant=pornopizza`
2. **Klikni na "Sign in with Google"**
3. **Malo by ťa presmerovať na Google OAuth consent screen**
4. **Po autorizácii by ťa malo presmerovať späť a prihlásiť**

## 🔍 Troubleshooting

### Ak stále vidíš chybu "Google OAuth is not configured":

1. **Skontroluj, či sú environment variables nastavené:**
   - Render dashboard → Environment tab
   - Mala by byť viditeľná `GOOGLE_CLIENT_ID` a `GOOGLE_CLIENT_SECRET`

2. **Skontroluj, či je service redeployovaný:**
   - Render dashboard → Deployments tab
   - Najnovší deployment by mal byť po pridaní environment variables

3. **Skontroluj backend logs:**
   - Render dashboard → Logs tab
   - Hľadaj chyby alebo potvrdenie, že OAuth je nakonfigurovaný

### Ak Google OAuth redirect nefunguje:

1. **Skontroluj Authorized redirect URIs v Google Console:**
   - Musí presne zodpovedať: `https://pizza-system-web.onrender.com/api/auth/customer/google/callback`
   - **Bez trailing slash!**

2. **Skontroluj, či je `BACKEND_URL` nastavený správne:**
   - Mala by byť: `https://pizza-system-web.onrender.com`

## 📝 Poznámka

- **Google OAuth je voliteľné** - aplikácia funguje aj bez neho (email/password login)
- **Ak nechceš používať Google OAuth**, môžeš nechať environment variables prázdne
- **Chyba sa zobrazí len pri kliknutí na "Sign in with Google"** - inak aplikácia funguje normálne

## 🎯 Úspešné Nastavenie

Po úspešnom nastavení:
- ✅ Google OAuth redirect funguje
- ✅ Používatelia sa môžu prihlásiť cez Google
- ✅ Automatické vytvorenie/aktualizácia účtu
- ✅ SMS verification stále potrebná (ak phone nie je verified)








