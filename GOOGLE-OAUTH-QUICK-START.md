# 🚀 Google OAuth - Rýchly Start (Lokálne)

## ✅ Áno, funguje to lokálne!

Nemusíš mať nič na hostingu. Google OAuth funguje perfektne na `localhost`.

---

## ⚡ Rýchly Checklist (5 minút)

### 1️⃣ Google Cloud Console (2 min)
- [ ] Choď na https://console.cloud.google.com/
- [ ] Vytvor nový projekt (alebo použij existujúci)
- [ ] Povoľ "Google Identity Services" API
- [ ] Nastav OAuth consent screen (External, tvoj email)
- [ ] Vytvor OAuth 2.0 Client ID:
  - Type: **Web application**
  - Redirect URI: `http://localhost:3000/api/auth/customer/google/callback`
- [ ] Skopíruj **Client ID** a **Client Secret**

### 2️⃣ Backend Setup (1 min)
- [ ] Otvor `backend/.env` súbor
- [ ] Pridaj:
  ```env
  GOOGLE_CLIENT_ID=tvoj_client_id
  GOOGLE_CLIENT_SECRET=tvoj_client_secret
  GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/customer/google/callback
  ```

### 3️⃣ Reštart Backend (1 min)
```bash
cd backend
npm run build
npm run start:dev
```

### 4️⃣ Test (1 min)
- [ ] Otvor: http://localhost:3001/auth/login?tenant=pornopizza
- [ ] Klikni "Prihláste sa pomocou Google"
- [ ] Mala by sa otvoriť Google OAuth consent screen
- [ ] Po autorizácii by ťa malo presmerovať späť a prihlásiť

---

## 🎯 Redirect URI (Dôležité!)

**Musí byť presne:**
```
http://localhost:3000/api/auth/customer/google/callback
```

**NIE:**
- ❌ `https://localhost:3000` (nie https)
- ❌ `http://127.0.0.1:3000` (musí byť localhost)

---

## 🐛 Rýchle Riešenie Problémov

### "redirect_uri_mismatch"
→ Skontroluj redirect URI v Google Cloud Console

### "invalid_client"
→ Skontroluj Client ID a Secret v `.env`

### "access_denied"
→ Pridaj svoj email ako test user v OAuth consent screen

---

## ✅ Hotovo!

Po týchto krokoch by Google OAuth mal fungovať lokálne! 🎉

**Detaily:** Pozri `GOOGLE-OAUTH-LOCAL-SETUP.md`

