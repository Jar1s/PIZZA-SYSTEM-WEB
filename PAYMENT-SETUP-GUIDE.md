# 💳 Návod na dokončenie platobnej brány

## 📋 Čo je už hotové

✅ **Implementácia platobnej brány je hotová:**
- Adyen integrácia (kompletná)
- GoPay integrácia (štruktúra pripravená)
- WePay integrácia (štruktúra pripravená)
- Webhook handling
- Automatické aktualizácie stavu objednávok
- Bezpečnostné overovanie podpisov

## 🎯 Čo treba doriešiť

### 1. Nastavenie Adyen TEST účtu (5-10 minút)

#### Krok 1: Vytvorenie účtu
1. Choď na: https://ca-test.adyen.com/
2. Zaregistruj sa pre test merchant účet
3. Over email

#### Krok 2: Získanie API kľúčov
1. Prihlás sa do Adyen Customer Area
2. Choď na **Developers → API credentials**
3. Vytvor nové credentials alebo vyber existujúce
4. Skopíruj **API key**
5. Poznač si **Merchant Account** názov

#### Krok 3: Konfigurácia Webhooku
1. Choď na **Developers → Webhooks**
2. Klikni **+ Webhook** → **Standard webhook**
3. Nastav **URL**: 
   - Pre lokálne testovanie: `https://your-ngrok-url.ngrok.io/api/webhooks/adyen`
   - Pre produkciu: `https://your-domain.com/api/webhooks/adyen`
4. Vyber eventy: ✅ **AUTHORISATION**
5. Klikni **Generate** pre vytvorenie HMAC kľúča
6. Skopíruj HMAC kľúč

### 2. Konfigurácia Environment Variables

Vytvor alebo uprav súbor `/backend/.env`:

```bash
# Databáza (už by malo byť nastavené)
DATABASE_URL="postgresql://user:password@localhost:5432/pizza_ecosystem"

# Adyen Konfigurácia (POVINNÉ)
ADYEN_API_KEY=AQE...tvoj_api_key
ADYEN_MERCHANT_ACCOUNT=YourMerchantAccountName
ADYEN_ENVIRONMENT=TEST  # TEST alebo LIVE
ADYEN_HMAC_KEY=tvoj_hmac_key_pre_webhooks

# Backend URL (pre webhooks)
BACKEND_URL=http://localhost:3000  # alebo https://your-domain.com
```

### 3. Konfigurácia Tenant Payment Config v databáze

Každý tenant potrebuje mať nastavený `paymentProvider` a `paymentConfig` v databáze.

#### Možnosť A: Cez Prisma Studio
```bash
cd backend
npx prisma studio
```
Potom uprav tenant a nastav:
- `paymentProvider`: `"adyen"`
- `paymentConfig`: 
```json
{
  "apiKey": "AQE...tvoj_api_key",
  "merchantAccount": "YourMerchantAccountName",
  "environment": "TEST"
}
```

#### Možnosť B: Cez SQL script
```sql
UPDATE tenants 
SET 
  "paymentProvider" = 'adyen',
  "paymentConfig" = '{
    "apiKey": "AQE...tvoj_api_key",
    "merchantAccount": "YourMerchantAccountName",
    "environment": "TEST"
  }'::jsonb
WHERE slug = 'pornopizza';
```

#### Možnosť C: Cez TypeScript script
Vytvor súbor `backend/prisma/setup-payment.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.tenant.update({
    where: { slug: 'pornopizza' },
    data: {
      paymentProvider: 'adyen',
      paymentConfig: {
        apiKey: process.env.ADYEN_API_KEY!,
        merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT!,
        environment: process.env.ADYEN_ENVIRONMENT || 'TEST',
      },
    },
  });
  
  console.log('✅ Payment config updated for pornopizza');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Spusti:
```bash
cd backend
npx ts-node prisma/setup-payment.ts
```

### 4. Testovanie platobnej brány

#### Krok 1: Spusti backend
```bash
cd backend
npm run start:dev
```

#### Krok 2: Vytvor objednávku (cez frontend alebo API)
```bash
curl -X POST http://localhost:3000/api/pornopizza/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+421900000000"
    },
    "address": {
      "street": "Test Street 1",
      "city": "Bratislava",
      "postalCode": "81101",
      "country": "SK"
    },
    "items": [
      { "productId": "YOUR_PRODUCT_ID", "quantity": 1 }
    ]
  }'
```

#### Krok 3: Vytvor payment session
```bash
curl -X POST http://localhost:3000/api/payments/session \
  -H "Content-Type: application/json" \
  -d '{"orderId": "YOUR_ORDER_ID"}'
```

#### Krok 4: Otestuj platbu
1. Otvor `redirectUrl` z odpovede v prehliadači
2. Použi test kartu:
   - **Číslo karty**: `4111 1111 1111 1111`
   - **CVV**: `737` (alebo akékoľvek 3 číslice)
   - **Expiry**: `03/30` (alebo akýkoľvek budúci dátum)
3. Dokonči platbu
4. Skontroluj, či sa objednávka aktualizovala na `PAID`

### 5. Lokálne testovanie webhookov (ngrok)

Pre lokálne testovanie webhookov potrebuješ public URL:

```bash
# Inštalácia ngrok
brew install ngrok  # macOS
# alebo stiahni z https://ngrok.com/

# Spusti ngrok
ngrok http 3000

# Skopíruj HTTPS URL (napr. https://abc123.ngrok.io)
# Použi ho v Adyen webhook konfigurácii:
# https://abc123.ngrok.io/api/webhooks/adyen
```

## 🧪 Testovacie karty (Adyen TEST)

### Úspešná platba
- **Karta**: `4111 1111 1111 1111`
- **CVV**: Akékoľvek 3 číslice
- **Expiry**: Akýkoľvek budúci dátum

### Zamietnutá platba
- **Karta**: `4000 0000 0000 0002`
- **CVV**: Akékoľvek 3 číslice
- **Expiry**: Akýkoľvek budúci dátum

### 3D Secure
- **Karta**: `4917 6100 0000 0000`
- **CVV**: Akékoľvek 3 číslice
- **Expiry**: Akýkoľvek budúci dátum

## 🔍 Kontrola, či to funguje

### 1. Skontroluj backend logy
Po vytvorení payment session by si mal vidieť:
```
✅ Adyen payment session created: CS...
```

### 2. Skontroluj Adyen Customer Area
- Choď na **Developers → Webhooks**
- Pozri si webhook logy
- Mala by sa tam zobraziť notifikácia po platbe

### 3. Skontroluj stav objednávky
```bash
curl http://localhost:3000/api/track/YOUR_ORDER_ID
```

Mala by sa zmeniť z `PENDING` na `PAID` po úspešnej platbe.

## 🚨 Časté problémy

### Problém: "Unsupported payment provider"
**Riešenie**: Skontroluj, či má tenant nastavený `paymentProvider` v databáze.

### Problém: "Invalid API key"
**Riešenie**: Skontroluj, či je `ADYEN_API_KEY` správne nastavený v `.env` a v tenant `paymentConfig`.

### Problém: Webhook neprichádza
**Riešenie**: 
1. Skontroluj, či je webhook URL public (použi ngrok pre lokálne testovanie)
2. Skontroluj, či je HMAC kľúč správny
3. Pozri si webhook logy v Adyen Customer Area

### Problém: "Order already processed"
**Riešenie**: Objednávka už má status iný ako `PENDING`. Vytvor novú objednávku.

## 📚 Ďalšie zdroje

- **Adyen dokumentácia**: https://docs.adyen.com/
- **Testovacie karty**: https://docs.adyen.com/development-resources/test-cards/
- **Adyen Customer Area**: https://ca-test.adyen.com/

## ✅ Checklist

- [ ] Adyen TEST účet vytvorený
- [ ] API key získaný
- [ ] Merchant Account názov poznám
- [ ] Webhook nakonfigurovaný
- [ ] HMAC kľúč získaný
- [ ] Environment variables nastavené v `.env`
- [ ] Tenant payment config nastavený v databáze
- [ ] Backend reštartovaný (aby načítal nové env variables)
- [ ] Testovacia platba úspešná
- [ ] Webhook prišiel a objednávka sa aktualizovala

---

**Status**: ✅ Kód je hotový, potrebuje len konfiguráciu

**Čas na setup**: ~15-20 minút

