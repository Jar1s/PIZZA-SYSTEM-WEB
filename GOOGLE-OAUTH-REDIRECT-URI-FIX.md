# 🔧 Oprava Google OAuth - redirect_uri_mismatch

## ❌ Chyba
```
Error 400: redirect_uri_mismatch
Access blocked: This app's request is invalid
```

## 🔍 Príčina
Redirect URI, ktoré backend posiela do Google, sa **nezhoduje** s tým, čo je nakonfigurované v Google Cloud Console.

## ✅ Riešenie

### Krok 1: Zisti, aký redirect URI backend používa

Backend používa redirect URI v tomto poradí:
1. `GOOGLE_REDIRECT_URI` environment variable (ak je nastavená)
2. `${FRONTEND_URL}/auth/google/callback` (ak `GOOGLE_REDIRECT_URI` nie je nastavená)

**Príklady:**
- Development: `http://localhost:3001/auth/google/callback`
- Production: `https://p0rnopizza.sk/auth/google/callback`
- Production (www): `https://www.p0rnopizza.sk/auth/google/callback`

### Krok 2: Skontroluj backend logs

Keď klikneš na "Sign in with Google", v backend logs by si mal vidieť:
```
🔐 Google OAuth redirect URI: https://p0rnopizza.sk/auth/google/callback
🔐 Google OAuth config: { redirectUri: '...', ... }
```

**Skopíruj presný redirect URI z logs.**

### Krok 3: Pridaj redirect URI do Google Cloud Console

1. Choď na [Google Cloud Console](https://console.cloud.google.com/)
2. Vyber tvoj projekt
3. **APIs & Services** → **Credentials**
4. Klikni na tvoj **OAuth 2.0 Client ID**
5. V sekcii **Authorized redirect URIs** klikni **+ ADD URI**
6. Pridaj **presne** ten istý redirect URI, ktorý vidíš v backend logs
7. Klikni **SAVE**

**Dôležité:**
- ✅ Redirect URI musí byť **presne** rovnaký (vrátane `http://` vs `https://`)
- ✅ Musí byť **bez trailing slash** na konci
- ✅ Ak používaš viacero domén (napr. `p0rnopizza.sk` a `www.p0rnopizza.sk`), pridaj obe

### Krok 4: Nastav Environment Variables (voliteľné)

Ak chceš explicitne nastaviť redirect URI, pridaj do backend environment variables:

**Na Render.com:**
```
GOOGLE_REDIRECT_URI=https://p0rnopizza.sk/auth/google/callback
FRONTEND_URL=https://p0rnopizza.sk
```

**Alebo pre development:**
```
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
FRONTEND_URL=http://localhost:3001
```

### Krok 5: Redeploy a testuj

1. **Redeploy backend** (ak si zmenil environment variables)
2. **Počkaj 2-3 minúty** na dokončenie
3. **Vyskúšaj Google OAuth prihlásenie znova**

## 🔍 Troubleshooting

### Stále vidíš `redirect_uri_mismatch`?

1. **Skontroluj backend logs** - aký redirect URI sa používa?
2. **Skontroluj Google Console** - je tam presne ten istý URI?
3. **Skontroluj environment variables** - je `GOOGLE_REDIRECT_URI` nastavená správne?
4. **Skontroluj, či nie je trailing slash** - `https://example.com/auth/google/callback/` ❌ vs `https://example.com/auth/google/callback` ✅

### Aký redirect URI by som mal použiť?

**Pre production:**
- Ak máš vlastnú doménu: `https://tvoja-domena.sk/auth/google/callback`
- Ak používaš viacero domén, pridaj všetky:
  - `https://p0rnopizza.sk/auth/google/callback`
  - `https://www.p0rnopizza.sk/auth/google/callback`

**Pre development:**
- `http://localhost:3001/auth/google/callback`

### Prečo sa používa frontend URL namiesto backend URL?

Google OAuth teraz používa **frontend redirect URI** namiesto backend, aby:
- ✅ Google consent screen zobrazoval tvoju doménu (nie backend)
- ✅ Lepšia UX - používatelia vidia známu doménu
- ✅ Lepšia bezpečnosť - redirect ide priamo na frontend

## ✅ Po oprave

Po pridaní správneho redirect URI do Google Console by Google OAuth mal fungovať bez chyby `redirect_uri_mismatch`.

