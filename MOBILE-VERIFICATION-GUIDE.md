# 📱 Sprievodca overením mobilného telefónu

## 🚀 Rýchly štart pre produkciu

**Chcete spustiť SMS overenie pre skutočných používateľov?** Postupujte podľa týchto krokov:

1. **Vytvorte Twilio účet** → [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. **Získajte telefónne číslo** → Phone Numbers → Buy a number (Slovakia)
3. **Skopírujte credentials** → Account SID a Auth Token z dashboardu
4. **Pridajte do `.env`** v `backend/`:
   ```bash
   TWILIO_ACCOUNT_SID=ACxxxxx
   TWILIO_AUTH_TOKEN=xxxxx
   TWILIO_PHONE_NUMBER=+421xxxxx
   ```
5. **Reštartujte backend** → `npm run start:dev`
6. **Otestujte** → Pošlite SMS kód cez frontend

**Viac detailov nižšie ↓**

---

## Ako funguje overenie mobilu

Systém používa SMS overenie pre bezpečné prihlásenie zákazníkov. Po prvom prihlásení (cez email/Google/Apple) musí zákazník overiť svoje telefónne číslo pomocou 6-miestneho kódu.

## 🔄 Proces overenia

### 1. **Prihlásenie zákazníka**
- Zákazník sa prihlási cez email, Google alebo Apple OAuth
- Ak telefón ešte nie je overený, systém presmeruje na stránku `/auth/verify-phone`

### 2. **Zadanie telefónneho čísla**
- Zákazník zadá svoje telefónne číslo (napr. `900123456`)
- Systém automaticky pridá predvoľbu `+421` pre slovenské čísla
- Po kliknutí na "Poslať kód" sa odošle SMS s 6-miestnym kódom

### 3. **Overenie kódu**
- Zákazník zadá 6-miestny kód z SMS
- Systém overí kód a označí telefón ako overený
- Zákazník je presmerovaný na svoj účet

## 🛠️ Technické detaily

### Backend endpointy

#### 1. **Poslanie SMS kódu**
```
POST /api/auth/customer/send-sms-code
Body: { phone: string, userId: string }
```

#### 2. **Overenie SMS kódu**
```
POST /api/auth/customer/verify-sms
Body: { phone: string, code: string, userId: string }
```

### Frontend stránka
- **Cesta**: `/app/auth/verify-phone/page.tsx`
- **URL parametre**: 
  - `userId` - ID používateľa (povinné)
  - `returnUrl` - URL kam presmerovať po overení (voliteľné)
  - `tenant` - tenant slug (voliteľné)

### Vývojový režim (DEV)

V development režime sa SMS **neodosielajú skutočne**, ale kód sa **zobrazuje v konzole backendu**.

**Ako získať kód v DEV režime:**

1. Spustite backend:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Požiadajte o SMS kód cez frontend

3. Kód sa zobrazí v konzole backendu:
   ```
   [DEV MODE] SMS Verification Code for +421900123456: 123456
   ```

**Alternatívne - pomocný skript:**

Môžete použiť skript `backend/get-sms-code.js`:
```bash
cd backend
node get-sms-code.js
```

Tento skript zobrazí najnovší aktívny SMS kód z databázy.

## 🔧 Konfigurácia pre produkciu

### Nastavenie Twilio (Odporúčané)

Twilio je najpopulárnejšia SMS služba s dobrým pokrytím na Slovensku.

#### Krok 1: Vytvorenie Twilio účtu

1. Choďte na [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Vytvorte si bezplatný účet (dostanete $15.50 kreditu na testovanie)
3. Overte svoje telefónne číslo

#### Krok 2: Získanie Twilio telefónneho čísla

1. Po prihlásení choďte do **Phone Numbers** → **Buy a number**
2. Vyberte krajinu: **Slovakia** (alebo inú krajinu)
3. Vyberte číslo s podporou **SMS**
4. Kliknite na **Buy** (cena: ~$1.50/mesiac)

**Poznámka:** Pre Slovensko môžete použiť aj číslo z inej krajiny (napr. USA), ale ceny za SMS budú vyššie.

#### Krok 3: Získanie API credentials

1. Choďte do **Console Dashboard**
2. Nájdite **Account SID** a **Auth Token**
3. Skopírujte obe hodnoty

#### Krok 4: Nastavenie environment premenných

Vytvorte alebo upravte súbor `.env` v priečinku `backend/`:

```bash
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+421XXXXXXXXX  # alebo +1XXXXXXXXXX pre USA číslo
```

**Dôležité:**
- `TWILIO_ACCOUNT_SID` začína s `AC`
- `TWILIO_AUTH_TOKEN` je citlivý údaj - nikdy ho nezdieľajte
- `TWILIO_PHONE_NUMBER` musí byť v E.164 formáte (s `+`)

#### Krok 5: Overenie konfigurácie

1. Reštartujte backend:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Skúste poslať SMS kód cez frontend

3. Skontrolujte konzolu backendu:
   - Ak vidíte: `SMS verification code sent to +421...` → ✅ Funguje!
   - Ak vidíte: `[DEV MODE] SMS Verification Code...` → ❌ Skontrolujte credentials

4. Skontrolujte Twilio Console → **Monitor** → **Logs** → **Messaging** pre detaily

### Alternatívne SMS služby

**Twilio nie je povinné!** Môžete použiť akúkoľvek SMS službu. Pre slovenské čísla odporúčame **SMS.sk** alebo **SMS API** (najlacnejšie - ~€0.03-0.05 za SMS).

📖 **Kompletný návod na integráciu inej služby**: Pozri [SMS-PROVIDERS-COMPARISON.md](./SMS-PROVIDERS-COMPARISON.md)

**Rýchle porovnanie:**
- **SMS.sk** - ~€0.03-0.05 za SMS (najlacnejšie pre Slovensko) ✅
- **SMS API** - ~€0.04-0.06 za SMS (slovenská služba) ✅
- **Twilio** - ~$0.05-0.10 za SMS (medzinárodná, dobrá dokumentácia)
- **MessageBird** - ~€0.05-0.10 za SMS (medzinárodná)
- **Vonage** - ~€0.05 za SMS (medzinárodná)

**Odporúčanie:**
- Pre **slovenské čísla**: SMS.sk alebo SMS API (najlacnejšie)
- Pre **medzinárodné čísla**: Twilio alebo MessageBird
- Pre **testovanie**: Twilio (bezplatný kredit) alebo DEV mode

### Ceny SMS správ

**Twilio:**
- Slovensko: ~$0.05-0.10 za SMS
- USA: ~$0.0075 za SMS
- Číslo: ~$1.50/mesiac

**Odporúčanie:**
- Pre **slovenské čísla**: SMS.sk alebo SMS API (najlacnejšie - ~€0.03-0.05 za SMS)
- Pre **medzinárodné čísla**: Twilio alebo MessageBird
- Pre **testovanie**: Twilio bezplatný účet ($15.50 kreditu) alebo DEV mode

📖 **Viac informácií**: Pozri [SMS-PROVIDERS-COMPARISON.md](./SMS-PROVIDERS-COMPARISON.md) pre kompletný návod na integráciu inej služby.

### Bezpečnostné poznámky

1. **Nikdy necommitnite `.env` súbor do Gitu**
   - Pridajte `.env` do `.gitignore`
   - Použite `.env.example` pre dokumentáciu

2. **Produkčné nasadenie (Fly.io, Heroku, atď.)**
   ```bash
   # Fly.io
   fly secrets set TWILIO_ACCOUNT_SID=ACxxxxx
   fly secrets set TWILIO_AUTH_TOKEN=xxxxx
   fly secrets set TWILIO_PHONE_NUMBER=+421xxxxx
   
   # Heroku
   heroku config:set TWILIO_ACCOUNT_SID=ACxxxxx
   heroku config:set TWILIO_AUTH_TOKEN=xxxxx
   heroku config:set TWILIO_PHONE_NUMBER=+421xxxxx
   ```

3. **Rate limiting**
   - Twilio má vlastné limity (100 SMS/deň na bezplatnom účte)
   - Pre produkciu zvážte upgrade na platený plán

**Poznámka:** Ak Twilio nie je nakonfigurované alebo používate testovacie číslo, systém automaticky prepne do DEV režimu a kód sa zobrazí v konzole.

## 📋 Databázový model

### SmsVerificationCode
- `phone` - telefónne číslo (E.164 formát, napr. `+421900123456`)
- `code` - 6-miestny overovací kód
- `userId` - ID používateľa (môže byť null pred registráciou)
- `expiresAt` - dátum expirácie (10 minút od vytvorenia)
- `isUsed` - či bol kód použitý
- `attempts` - počet pokusov o overenie (max 5)

### User
- `phone` - telefónne číslo (unique)
- `phoneVerified` - boolean, či je telefón overený

## 🚀 Testovanie

### 1. **Lokálne testovanie**

1. Spustite backend:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Spustite frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Prihláste sa ako zákazník (email/Google/Apple)

4. Ak telefón nie je overený, presmeruje vás na `/auth/verify-phone`

5. Zadajte telefónne číslo (napr. `900123456`)

6. Kliknite na "Poslať kód"

7. Skontrolujte konzolu backendu pre kód:
   ```
   [DEV MODE] SMS Verification Code for +421900123456: 123456
   ```

8. Zadajte kód do formulára

9. Po úspešnom overení budete presmerovaní na účet

### 2. **Kontrola v databáze**

Môžete skontrolovať kódy v databáze:
```bash
cd backend
node get-sms-code.js
```

## ⚠️ Dôležité poznámky

1. **Rate limiting**: 
   - Max 1 SMS kód za minútu na telefónne číslo
   - Max 10 pokusov o overenie za minútu

2. **Expirácia kódu**: 
   - Kód je platný 10 minút

3. **Max pokusy**: 
   - Max 5 pokusov na overenie jedného kódu
   - Po 5 neúspešných pokusoch musíte požiadať o nový kód

4. **Formát telefónneho čísla**: 
   - Systém automaticky formátuje na E.164 (napr. `+421900123456`)
   - Pre slovenské čísla sa automaticky pridá `+421`

## 🐛 Riešenie problémov

### Kód sa neodosiela
- Skontrolujte konzolu backendu - v DEV režime sa kód zobrazí tam
- Skontrolujte, či backend beží
- Skontrolujte rate limiting (max 1 kód za minútu)

### Kód je neplatný
- Skontrolujte, či kód nie je expirovaný (platný 10 minút)
- Skontrolujte, či ste neprekročili max počet pokusov (5)
- Požiadajte o nový kód

### Telefón nie je overený po overení
- Skontrolujte databázu - `phoneVerified` by malo byť `true`
- Skontrolujte konzolu backendu pre chyby
- Skúste sa odhlásiť a prihlásiť znova

## 📞 Podpora

Ak máte problémy s overením mobilu:
1. Skontrolujte konzolu backendu pre chyby
2. Skontrolujte databázu pre SMS kódy
3. Skontrolujte, či je backend správne nakonfigurovaný

