# 🔐 Nastavenie Google OAuth na Render.com

## Problém:
Po kliknutí na "Continue" v Google OAuth sa zobrazí chyba:
```
https://www.p0rnopizza.sk/auth/login?error=not_configured
```

## Príčina:
Na Render.com nie sú nastavené Google OAuth credentials (`GOOGLE_CLIENT_ID` a `GOOGLE_CLIENT_SECRET`).

## ✅ Riešenie:

### Krok 1: Získaj Google OAuth Credentials

1. **Choď na [Google Cloud Console](https://console.cloud.google.com/)**
2. **Vyber projekt** alebo vytvor nový
3. **APIs & Services** → **Credentials**
4. **Klikni na "Create Credentials"** → **OAuth 2.0 Client ID**
5. **Ak ešte nemáš OAuth consent screen:**
   - Klikni na "Configure Consent Screen"
   - User Type: **External** (pre verejné použitie)
   - App name: **PornoPizza**
   - Authorized domains: `p0rnopizza.sk`, `pornopizza.sk`
   - Scopes: `email`, `profile`, `openid`
   - Klikni "Save and Continue"
6. **Vytvor OAuth 2.0 Client ID:**
   - Application type: **Web application**
   - Name: **PornoPizza OAuth Client**
   - **Authorized redirect URIs:**
     ```
     https://pizza-system-web.onrender.com/api/auth/customer/google/callback
     ```
   - Klikni "Create"
7. **Skopíruj credentials:**
   - **Client ID** (napr. `123456789-abc.apps.googleusercontent.com`)
   - **Client Secret** (napr. `GOCSPX-abc123...`)

### Krok 2: Nastav Environment Variables na Render.com

1. **Choď na [Render Dashboard](https://dashboard.render.com/)**
2. **Vyber tvoj backend service** (`pizza-ecosystem-api` alebo podobný názov)
3. **Klikni na "Environment"** v ľavom menu
4. **Klikni na "Add Environment Variable"** pre každú premennú:

#### Pridaj tieto premenné:

```
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

```
GOOGLE_CLIENT_SECRET=GOCSPX-abc123...
```

```
GOOGLE_REDIRECT_URI=https://pizza-system-web.onrender.com/api/auth/customer/google/callback
```

```
BACKEND_URL=https://pizza-system-web.onrender.com
```

```
FRONTEND_URL=https://www.p0rnopizza.sk
```

**Dôležité:**
- Nahraď `123456789-abc.apps.googleusercontent.com` svojím skutočným Client ID
- Nahraď `GOCSPX-abc123...` svojím skutočným Client Secret
- `GOOGLE_REDIRECT_URI` musí byť **presne** rovnaký ako v Google Cloud Console
- `BACKEND_URL` musí byť bez trailing slash
- `FRONTEND_URL` musí byť tvoja skutočná frontend doména

### Krok 3: Redeploy Backend

1. **Render automaticky redeployuje** po pridaní environment variables
2. **Alebo klikni na "Manual Deploy"** → **"Deploy latest commit"**
3. **Počkaj 2-3 minúty** na dokončenie deployu

### Krok 4: Testuj Google OAuth

1. **Choď na frontend**: `https://www.p0rnopizza.sk/auth/login`
2. **Klikni na "Sign in with Google"**
3. **Vyber Google účet a klikni "Continue"**
4. **Malo by ťa presmerovať späť a prihlásiť** (nie na login s chybou)

## 🔍 Troubleshooting

### Ak stále vidíš `error=not_configured`:

1. **Skontroluj Render.com Environment:**
   - Render Dashboard → Environment tab
   - Mala by byť viditeľná `GOOGLE_CLIENT_ID` a `GOOGLE_CLIENT_SECRET`
   - Skontroluj, či sú hodnoty správne (bez medzier, bez úvodzoviek)

2. **Skontroluj backend logs na Render.com:**
   - Render Dashboard → Logs tab
   - Hľadaj chyby s "Google OAuth is not configured"
   - Skontroluj, či backend vidí environment variables

3. **Skontroluj, či je service redeployovaný:**
   - Render Dashboard → Deployments tab
   - Najnovší deployment by mal byť po pridaní environment variables

### Ak vidíš `error=redirect_uri_mismatch`:

1. **Skontroluj Google Cloud Console:**
   - Authorized redirect URIs musí obsahovať presne:
     ```
     https://pizza-system-web.onrender.com/api/auth/customer/google/callback
     ```
   - **Bez trailing slash!**

2. **Skontroluj `GOOGLE_REDIRECT_URI` v Render.com:**
   - Musí byť presne rovnaký ako v Google Console

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

