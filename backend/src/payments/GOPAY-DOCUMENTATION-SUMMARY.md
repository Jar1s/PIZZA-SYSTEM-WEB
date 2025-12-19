# GoPay REST API - Dokumentační shrnutí

**Datum**: 19. prosince 2025  
**Zdroj**: https://doc.gopay.cz/ (oficiální dokumentace)

## 📋 Přehled

GoPay REST API umožňuje integraci platební brány do aplikace pomocí OAuth2 autentizace a REST API endpointů.

## 🔐 Autentizace (OAuth2)

### Endpoint
- **Sandbox**: `https://gw.sandbox.gopay.com/api/oauth2/token`
- **Production**: `https://gate.gopay.cz/api/oauth2/token`

### Požadavky

**Headers:**
```
Accept: application/json
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <Base64-encoded ClientId:ClientSecret>
```

**Body (form-urlencoded):**
```
grant_type=client_credentials
scope=payment-create
```

### ⚠️ DŮLEŽITÉ: Basic Authentication

GoPay **vyžaduje** Basic Authentication v headeru `Authorization` s Base64-encoded `ClientId:ClientSecret`.

**Příklad:**
```typescript
const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
headers: {
  'Authorization': `Basic ${credentials}`,
  'Content-Type': 'application/x-www-form-urlencoded',
  'Accept': 'application/json',
}
```

### Response

```json
{
  "token_type": "bearer",
  "access_token": "AAAnu3YnAHRk298EsmyttFQMcbCcvmwTKK5hrJx2aGG8ZnFyBJhAvFWNmbWVSD7p",
  "expires_in": 1800,
  "refresh_token": "ObrapXqkh3SaWifBQ4PS0kYRIbXGqUDr4t6PECZFE0lFox5uXtWNb/QzeDrk8wsWDVOn+vvCAPCPAnr+B8aon+JpW5hPVwlNj71eupst+k8="
}
```

- **Token platnost**: 30 minut (1800 sekund)
- **Použití**: Bearer token v `Authorization` headeru pro další API požadavky

## 💳 Vytvoření platby

### Endpoint
- **Sandbox**: `https://gw.sandbox.gopay.com/api/payments/payment`
- **Production**: `https://gate.gopay.cz/api/payments/payment`

### Request

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**
```json
{
  "target": {
    "type": "ACCOUNT",
    "goid": "YOUR-GOID"
  },
  "amount": 10000,
  "currency": "CZK",
  "order_number": "123456",
  "items": [
    {
      "name": "Pizza Margherita",
      "amount": 5000,
      "count": 1
    }
  ],
  "callback": {
    "return_url": "https://www.example.com/return",
    "notification_url": "https://www.example.com/notify"
  }
}
```

### Response

```json
{
  "id": 123456789,
  "gw_url": "https://gate.gopay.cz/gw/v3/...",
  "state": "CREATED",
  ...
}
```

- **id**: ID platby v GoPay systému
- **gw_url**: URL pro redirect zákazníka na platební bránu
- **state**: Stav platby (CREATED, PAYMENT_METHOD_CHOSEN, PAID, CANCELED, etc.)

## 🔔 Webhook notifikace

### Endpoint
Webhook URL musí být veřejně dostupná a přijímat POST požadavky.

### Signature Verification

GoPay posílá webhook notifikace s HMAC-SHA256 podpisem.

**Header:**
- `X-GoPay-Signature` nebo `signature` (závisí na verzi API)

**Verifikace:**
1. Získej raw body webhooku (bez úprav)
2. Vypočítej HMAC-SHA256 hash pomocí `Client Secret`
3. Porovnej s podpisem z headeru (timing-safe comparison)

**Příklad:**
```typescript
const hmac = crypto.createHmac('sha256', clientSecret);
hmac.update(rawBody);
const calculatedSignature = hmac.digest('hex');

// Timing-safe comparison
return crypto.timingSafeEqual(
  Buffer.from(receivedSignature),
  Buffer.from(calculatedSignature)
);
```

### Webhook Payload

```json
{
  "id": 123456789,
  "order_number": "123456",
  "state": "PAID",
  "amount": 10000,
  "currency": "CZK",
  ...
}
```

**Stavy platby:**
- `CREATED` - Platba vytvořena
- `PAYMENT_METHOD_CHOSEN` - Zákazník vybral platební metodu
- `PAID` - Platba úspěšně dokončena ✅
- `CANCELED` - Platba zrušena ❌
- `TIMEOUTED` - Platba vypršela ⏱️

## 🔧 Aktuální implementace - Problémy a opravy

### ❌ Problém 1: Chybí Basic Authentication v OAuth2

**Současný kód:**
```typescript
const tokenResponse = await fetch(`${apiUrl}/api/oauth2/token`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
  },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'payment-create',
  }),
});
```

**Oprava:**
Přidat Basic Authentication header s ClientId:ClientSecret.

### ✅ Správně: Webhook signature verification

Aktuální implementace webhook verifikace je správná - používá HMAC-SHA256 a timing-safe comparison.

### ⚠️ Poznámka: Webhook header name

GoPay může používat buď `signature` nebo `X-GoPay-Signature` header. Aktuální implementace kontroluje `signature`, což je v pořádku, ale mělo by se podporovat i `X-GoPay-Signature`.

## 📝 Doporučení

1. **Opravit OAuth2 autentizaci** - přidat Basic Authentication header
2. **Podporovat oba webhook header názvy** - `signature` i `X-GoPay-Signature`
3. **Přidat error handling** - lepší zpracování chyb z GoPay API
4. **Logování** - přidat detailnější logování pro debugging
5. **Token refresh** - implementovat refresh token mechanismus (pokud je potřeba)

## 🔗 Užitečné odkazy

- **Dokumentace**: https://doc.gopay.cz/
- **Anglická verze**: https://doc.gopay.com/
- **Support**: integrace@gopay.cz
