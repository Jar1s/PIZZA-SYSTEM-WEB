# 🔐 Google OAuth - Lokálne Nastavenie

## ✅ Áno, môžeš to otestovať lokálne!

Google OAuth funguje perfektne na localhost. Nemusíš mať nič na hostingu.

---

## 📋 Krok za krokom - Lokálne Nastavenie

### 1. Vytvor Google OAuth Credentials

1. **Choď na [Google Cloud Console](https://console.cloud.google.com/)**
   - Ak nemáš účet, vytvor si ho (je to zadarmo)
   - Ak nemáš projekt, vytvor si nový projekt

2. **Povoľ Google Identity API**
   - V Google Cloud Console → **APIs & Services** → **Library**
   - Vyhľadaj "Google Identity Services" alebo "Google+ API"
   - Klikni **Enable**

3. **Nastav OAuth Consent Screen**
   - **APIs & Services** → **OAuth consent screen**
   - **User Type**: Vyber **External** (pre verejné použitie)
   - **App name**: Napríklad "Pizza App Local"
   - **User support email**: Tvoj email
   - **Developer contact**: Tvoj email
   - Klikni **Save and Continue**
   - **Scopes**: Pridaj `email`, `profile`, `openid`
   - Klikni **Save and Continue**
   - **Test users**: Môžeš pridať svoj email (voliteľné)
   - Klikni **Save and Continue**

4. **Vytvor OAuth 2.0 Client ID**
   - **APIs & Services** → **Credentials**
   - Klikni **Create Credentials** → **OAuth 2.0 Client ID**
   - **Application type**: Vyber **Web application**
   - **Name**: Napríklad "Pizza App Local Dev"
   - **Authorized redirect URIs**: 
     ```
     http://localhost:3000/api/auth/customer/google/callback
     ```
   - **Dôležité**: Musí byť presne `http://localhost:3000` (nie `https`)
   - Klikni **Create**

5. **Skopíruj Credentials**
   - Po vytvorení uvidíš:
     - **Client ID** (napr. `123456789-abc.apps.googleusercontent.com`)
     - **Client Secret** (napr. `GOCSPX-abc123...`)
   - **Skopíruj oba** - budú potrebné v ďalšom kroku

---

### 2. Pridaj Credentials do Backend

1. **Otvori `.env` súbor v backend priečinku**
   ```bash
   cd backend
   # Ak nemáš .env súbor, vytvor ho
   touch .env
   ```

2. **Pridaj tieto riadky do `.env`**:
   ```env
   # Google OAuth - Lokálne
   GOOGLE_CLIENT_ID=tvoj_client_id_tu
   GOOGLE_CLIENT_SECRET=tvoj_client_secret_tu
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/customer/google/callback
   
   # URLs
   BACKEND_URL=http://localhost:3000
   FRONTEND_URL=http://localhost:3001
   ```

3. **Nahraď hodnoty**:
   - `tvoj_client_id_tu` → Tvoj Client ID z Google Cloud Console
   - `tvoj_client_secret_tu` → Tvoj Client Secret z Google Cloud Console

---

### 3. Reštartuj Backend Server

```bash
cd backend
npm run build
npm run start:dev
```

---

### 4. Testuj Google OAuth

1. **Otvori frontend**: `http://localhost:3001/auth/login?tenant=pornopizza`
2. **Klikni na "Prihláste sa pomocou Google"**
3. **Malo by ťa presmerovať na Google OAuth consent screen**
4. **Vyber Google účet a autorizuj**
5. **Malo by ťa presmerovať späť a prihlásiť**

---

## ⚠️ Dôležité Poznámky

### Redirect URI musí byť presne:
```
http://localhost:3000/api/auth/customer/google/callback
```

**NIE:**
- ❌ `https://localhost:3000` (nie https)
- ❌ `http://localhost:3000/callback` (nesprávna cesta)
- ❌ `http://127.0.0.1:3000` (musí byť localhost)

### Test Mode vs Production

- **Lokálne**: Google OAuth funguje v "Test mode"
- **Test mode**: Môžeš pridať test users (svoj email)
- **Production**: Potrebuješ verifikovať app v Google Cloud Console

---

## 🧪 Testovanie

### 1. Skontroluj, či backend beží:
```bash
curl http://localhost:3000/api/tenants
```

### 2. Skontroluj Google OAuth endpoint:
```bash
curl http://localhost:3000/api/auth/customer/google
```

**Ak nie je nakonfigurovaný**, uvidíš:
```json
{"message":"Google OAuth is not configured...","statusCode":400}
```

**Ak je nakonfigurovaný**, presmeruje ťa na Google OAuth consent screen.

---

## 🐛 Riešenie Problémov

### Problém: "redirect_uri_mismatch"
- **Riešenie**: Skontroluj, či je redirect URI v Google Cloud Console presne:
  ```
  http://localhost:3000/api/auth/customer/google/callback
  ```

### Problém: "invalid_client"
- **Riešenie**: Skontroluj, či máš správny Client ID a Client Secret v `.env`

### Problém: "access_denied"
- **Riešenie**: Skontroluj, či máš pridaný svoj email ako test user v OAuth consent screen

---

## ✅ Výhody Lokálneho Testovania

- ✅ **Zadarmo** - Google OAuth je zadarmo
- ✅ **Rýchle** - Nemusíš čakať na hosting
- ✅ **Bezpečné** - Testuješ lokálne
- ✅ **Jednoduché** - Stačí pridať credentials do `.env`

---

## 🚀 Po Lokálnom Testovaní

Keď budeš chcieť nasadiť na produkciu:

1. **Pridaj produkčný redirect URI** do Google Cloud Console:
   ```
   https://your-backend-domain.com/api/auth/customer/google/callback
   ```

2. **Aktualizuj `.env`** na produkcii:
   ```env
   GOOGLE_REDIRECT_URI=https://your-backend-domain.com/api/auth/customer/google/callback
   BACKEND_URL=https://your-backend-domain.com
   FRONTEND_URL=https://your-frontend-domain.com
   ```

3. **Verifikuj app** v Google Cloud Console (pre produkciu)

---

## 📝 Súhrn

✅ **Môžeš testovať lokálne** - nemusíš mať nič na hostingu  
✅ **Stačí Google Cloud Console účet** (zadarmo)  
✅ **Pridaj credentials do `.env`**  
✅ **Reštartuj backend**  
✅ **Hotovo!** 🎉

---

**Všetko funguje lokálne!** 🚀

