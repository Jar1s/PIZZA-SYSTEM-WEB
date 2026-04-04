# GoPay Setup Guide

Kompletní průvodce nastavením GoPay platební brány pro multi-tenant pizza ordering platform.

## Přehled

GoPay je česká platební brána, která podporuje online platby kartou, bankovní převody a další platební metody. Tento dokument popisuje, jak nastavit GoPay integraci v systému.

## Požadavky

- GoPay účet (sandbox nebo production)
- GoPay credentials (Client ID, Client Secret, GoID)
- Veřejně dostupná URL pro webhook notifikace

## 1. Získání GoPay Credentials

### Sandbox prostředí

1. Zaregistrujte se na https://help.gopay.com/
2. Požádejte o sandbox přístup na integrace@gopay.cz
3. Získáte:
   - **Client ID** - identifikátor aplikace
   - **Client Secret** - tajný klíč pro autentizaci
   - **GoID** - identifikátor GoPay účtu

### Production prostředí

1. Kontaktujte GoPay support na integrace@gopay.cz
2. Projděte proces ověření
3. Získáte production credentials

## 2. Konfigurace Tenant v databázi

### Nastavení payment provider

Aktualizujte tenant záznam v databázi:

```sql
UPDATE "Tenant" 
SET "paymentProvider" = 'gopay'
WHERE "subdomain" = 'your-tenant-subdomain';
```

### Nastavení paymentConfig

Aktualizujte `paymentConfig` pole v tenant záznamu:

```sql
UPDATE "Tenant"
SET "paymentConfig" = jsonb_build_object(
  'clientId', 'YOUR_CLIENT_ID',
  'clientSecret', 'YOUR_CLIENT_SECRET',
  'goId', 'YOUR_GOID',
  'environment', 'sandbox' -- nebo 'production'
)
WHERE "subdomain" = 'your-tenant-subdomain';
```

**Příklad paymentConfig:**
```json
{
  "clientId": "1234567890",
  "clientSecret": "abcdefghijklmnopqrstuvwxyz",
  "goId": "9876543210",
  "environment": "sandbox"
}
```

## 3. Environment Variables (volitelné)

Pokud chcete použít globální GoPay credentials (místo per-tenant konfigurace), můžete nastavit:

```bash
GOPAY_CLIENT_SECRET=your_client_secret
```

**Poznámka:** `GOPAY_CLIENT_SECRET` se používá pouze pro webhook signature verification. Pro vytváření plateb se používají credentials z tenant `paymentConfig`.

## 4. Webhook URL konfigurace

GoPay potřebuje veřejně dostupnou URL pro webhook notifikace.

### Production

Webhook URL je automaticky nastavena na:
```
https://your-backend-domain.com/api/webhooks/gopay
```

### Development (lokální testování)

Pro lokální testování použijte ngrok nebo podobný nástroj:

```bash
ngrok http 3000
```

Pak nastavte `BACKEND_URL` environment variable:
```bash
BACKEND_URL=https://your-ngrok-url.ngrok.io
```

Webhook URL bude:
```
https://your-ngrok-url.ngrok.io/api/webhooks/gopay
```

## 5. Testování v Sandbox

### Testovací platební karty

GoPay sandbox poskytuje testovací karty. Kontaktujte GoPay support pro aktuální testovací karty.

### Testovací flow

1. Vytvořte objednávku v systému
2. Vyberte "Platba kartou" (online payment)
3. Systém přesměruje na GoPay platební bránu
4. Použijte testovací kartu
5. Po úspěšné platbě se zákazník vrátí na return URL
6. Webhook automaticky aktualizuje stav objednávky na PAID

### Kontrola webhooků

Zkontrolujte backend logy pro webhook notifikace:
```bash
# V logu byste měli vidět:
✅ GoPay payment created: 123456789
✅ GoPay payment successful for order cm3abc..., delivery created
```

## 6. Přepnutí na Production

### 1. Aktualizujte paymentConfig

```sql
UPDATE "Tenant"
SET "paymentConfig" = jsonb_set(
  "paymentConfig",
  '{environment}',
  '"production"'
)
WHERE "subdomain" = 'your-tenant-subdomain';
```

### 2. Aktualizujte credentials

```sql
UPDATE "Tenant"
SET "paymentConfig" = jsonb_build_object(
  'clientId', 'PRODUCTION_CLIENT_ID',
  'clientSecret', 'PRODUCTION_CLIENT_SECRET',
  'goId', 'PRODUCTION_GOID',
  'environment', 'production'
)
WHERE "subdomain" = 'your-tenant-subdomain';
```

### 3. Zkontrolujte webhook URL

Ujistěte se, že webhook URL je správně nastavena v GoPay administraci.

## 7. Podporované měny

GoPay podporuje tyto měny:
- **CZK** (Česká koruna)
- **EUR** (Euro)
- **USD** (US Dollar)

Měna se automaticky získá z tenant konfigurace (`tenant.currency`). Pokud není nastavena, použije se EUR.

## 8. Refund (Vrácení platby)

Systém automaticky provede refund, když admin zruší objednávku v admin panelu, pokud:
- Objednávka je zaplacená přes GoPay (`paymentProvider: 'gopay'`)
- Objednávka má `paymentRef` (GoPay payment ID)
- Objednávka má `paymentStatus: 'success'`
- Objednávka má status PAID, PREPARING nebo OUT_FOR_DELIVERY

Refund se provede automaticky při změně statusu na CANCELED.

## 9. Troubleshooting

### Problém: "Failed to get GoPay access token"

**Řešení:**
- Zkontrolujte, že `clientId` a `clientSecret` jsou správně nastaveny v `paymentConfig`
- Ověřte, že credentials jsou pro správné prostředí (sandbox vs production)
- Zkontrolujte, že API URL je správná (sandbox: `https://gw.sandbox.gopay.com`, production: `https://gate.gopay.cz`)

### Problém: "Invalid GoPay webhook signature"

**Řešení:**
- Zkontrolujte, že `GOPAY_CLIENT_SECRET` environment variable je nastavena
- Ověřte, že webhook používá raw body pro signature verification
- Zkontrolujte, že client secret odpovídá credentials v GoPay administraci

### Problém: "GoPay payment response missing gw_url"

**Řešení:**
- Zkontrolujte, že GoPay API vrátilo správnou response
- Ověřte, že payment byl úspěšně vytvořen v GoPay systému
- Zkontrolujte backend logy pro detailní error message

### Problém: Webhook notifikace nepřicházejí

**Řešení:**
- Ověřte, že webhook URL je veřejně dostupná
- Zkontrolujte, že webhook URL je správně nastavena v GoPay administraci
- Pro lokální testování použijte ngrok
- Zkontrolujte firewall nastavení

### Problém: Refund selže

**Řešení:**
- Zkontrolujte, že credentials mají scope `payment-all` (ne jen `payment-create`)
- Ověřte, že payment ID je správné
- Zkontrolujte, že platba byla úspěšně dokončena před refundem
- Zkontrolujte backend logy pro detailní error message

## 10. API Endpoints

### Sandbox
- **OAuth2 Token**: `https://gw.sandbox.gopay.com/api/oauth2/token`
- **Create Payment**: `https://gw.sandbox.gopay.com/api/payments/payment`
- **Refund**: `https://gw.sandbox.gopay.com/api/payments/payment/{id}/refund`

### Production
- **OAuth2 Token**: `https://gate.gopay.cz/api/oauth2/token`
- **Create Payment**: `https://gate.gopay.cz/api/payments/payment`
- **Refund**: `https://gate.gopay.cz/api/payments/payment/{id}/refund`

## 11. Dokumentace

- **Oficiální dokumentace**: https://doc.gopay.cz/
- **Anglická verze**: https://doc.gopay.com/
- **Support**: integrace@gopay.cz

## 12. Bezpečnost

- **NIKDY** neukládejte credentials do kódu
- Používejte environment variables nebo databázové konfigurace
- Webhook signature verification je povinná (kromě development módu)
- Používejte HTTPS pro všechny webhook URL
- Pravidelně rotujte credentials

## 13. Monitoring

Doporučené metriky pro monitoring:
- Počet úspěšných plateb
- Počet neúspěšných plateb
- Průměrná doba zpracování platby
- Počet refundů
- Webhook success rate

---

**Status**: ✅ Production Ready

**Last Updated**: December 19, 2025




