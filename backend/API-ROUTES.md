# 📋 Kompletný zoznam API Routes

## Ako zobraziť routes

### 1. V prehliadači
Otvor `http://localhost:3000/api/routes` (po spustení backendu)

### 2. V kóde
Všetky routes sú definované v controller súboroch v `backend/src/`

---

## 🌐 Všetky dostupné endpointy

### Health & Info
```
GET  /api/health                    - Health check
GET  /                              - API info a zoznam endpointov
GET  /api/routes                    - Kompletný zoznam všetkých routes
```

### Tenants
```
GET  /api/tenants                   - Zoznam všetkých tenantov
GET  /api/tenants/resolve?domain=   - Nájsť tenant podľa domény
GET  /api/tenants/:slug             - Konkrétny tenant
POST /api/tenants                   - Vytvoriť nový tenant
PATCH /api/tenants/:slug            - Aktualizovať tenant
```

### Products
```
GET    /api/:tenantSlug/products              - Všetky produkty
GET    /api/:tenantSlug/products?category=    - Produkty podľa kategórie
GET    /api/:tenantSlug/products/categories    - Zoznam kategórií
GET    /api/:tenantSlug/products/:id           - Konkrétny produkt
POST   /api/:tenantSlug/products               - Vytvoriť produkt (admin)
PATCH  /api/:tenantSlug/products/:id           - Aktualizovať produkt (admin)
DELETE /api/:tenantSlug/products/:id          - Vymazať produkt (admin)
POST   /api/:tenantSlug/products/bulk-import  - Hromadný import (admin)
```

### Delivery Zones
```
POST /api/delivery-zones/:tenantSlug/calculate-fee      - Výpočet delivery fee
POST /api/delivery-zones/:tenantSlug/validate-min-order - Validácia minimálnej objednávky
```

### Auth - Customer
```
POST /api/auth/customer/check-email      - Kontrola, či email existuje
POST /api/auth/customer/register        - Registrácia nového zákazníka
POST /api/auth/customer/login            - Prihlásenie
POST /api/auth/customer/set-password    - Nastavenie hesla pomocou tokenu
POST /api/auth/customer/refresh         - Obnovenie access tokenu
POST /api/auth/customer/logout          - Odhlásenie
GET  /api/auth/customer/me              - Aktuálny používateľ
POST /api/auth/customer/send-sms-code   - Poslať SMS kód
POST /api/auth/customer/verify-sms       - Overiť SMS kód
POST /api/auth/customer/verify-phone    - Overiť telefónne číslo
```

### Auth - OAuth
```
GET  /api/auth/google                  - Google OAuth login
GET  /api/auth/apple                   - Apple OAuth login
GET  /api/auth/oauth/callback          - OAuth callback
```

### Orders
```
POST   /api/:tenantSlug/orders              - Vytvoriť objednávku
GET    /api/:tenantSlug/orders               - Zoznam objednávok (s filtrami)
GET    /api/:tenantSlug/orders?status=       - Filtrovať podľa statusu
GET    /api/:tenantSlug/orders?startDate=    - Filtrovať podľa dátumu
GET    /api/:tenantSlug/orders/:id           - Konkrétna objednávka
PATCH  /api/:tenantSlug/orders/:id/status    - Zmeniť status objednávky
POST   /api/:tenantSlug/orders/:id/sync-storyous - Synchronizovať so Storyous
```

### Tracking (Public)
```
GET /api/track/:orderId                - Public tracking objednávky (bez autentifikácie)
```

### Customer Account (vyžaduje auth token)
```
GET    /api/customer/account/profile         - Profil zákazníka
PATCH  /api/customer/account/profile         - Aktualizovať profil
GET    /api/customer/account/addresses       - Adresy zákazníka
POST   /api/customer/account/addresses       - Pridanie adresy
PATCH  /api/customer/account/addresses/:id   - Aktualizovať adresu
DELETE /api/customer/account/addresses/:id   - Vymazať adresu
GET    /api/customer/account/orders          - História objednávok
```

### Payments
```
POST /api/payments/session              - Vytvoriť payment session (Adyen/GoPay)
```

### Webhooks
```
POST /api/webhooks/adyen                - Adyen webhook (internal)
POST /api/webhooks/gopay                 - GoPay webhook (internal)
POST /api/webhooks/delivery              - Delivery webhook (internal)
```

### Analytics
```
GET /api/analytics/:tenantSlug/dashboard - Analytics dashboard
```

### Upload
```
POST /api/upload                         - Upload súboru
```

---

## 📝 Poznámky

### Tenant Slug
Väčšina endpointov používa `:tenantSlug` v URL:
- Príklad: `/api/pornopizza/products`
- Príklad: `/api/pizzavnudzi/orders`

### Autentifikácia
Niektoré endpointy vyžadujú auth token:
```
Authorization: Bearer <token>
```

### Query Parameters
Niektoré GET endpointy podporujú query parametre:
- `?category=PIZZA` - filtrovanie
- `?status=PENDING` - filtrovanie
- `?startDate=2025-01-01&endDate=2025-01-31` - dátumový rozsah

---

## 🔍 Ako nájsť konkrétny endpoint v kóde

1. **Products**: `backend/src/products/products.controller.ts`
2. **Orders**: `backend/src/orders/orders.controller.ts`
3. **Auth**: `backend/src/auth/customer-auth.controller.ts`
4. **Delivery Zones**: `backend/src/delivery/delivery-zone.controller.ts`
5. **Customer**: `backend/src/customer/customer.controller.ts`
6. **Tenants**: `backend/src/tenants/tenants.controller.ts`

---

## 🧪 Testovanie

Použi súbor `backend/api-test.http` s REST Client extension v VS Code.

---

## 🔐 Produkčné nastavenie API

### API DEMO vs Produkcia

**API DEMO:**
- Obsahuje základné príklady a dokumentáciu
- Niektoré veci popísané v emailoch sú aj v API DEMO
- Vhodné pre testovanie a vývoj

**Produkcia:**
- Všetko potrebné sa **automaticky generuje** po zadaní údajov v systéme
- Po zadaní údajov v systéme sa **všetky potrebné credentials a konfigurácia pošlú na email pre IT tím**
- Produkčné credentials sa generujú automaticky a nie je potrebné ich manuálne nastavovať

### Proces získania produkčných credentials

1. **Zadanie údajov v systéme** - Zadať požadované informácie v administračnom systéme
2. **Automatické generovanie** - Systém automaticky vygeneruje všetky potrebné credentials, API kľúče a konfiguráciu
3. **Email pre IT** - Všetky potrebné údaje sa pošlú na email pre IT tím
4. **Nastavenie** - IT tím použije prijaté credentials na nastavenie produkčného prostredia

### Poznámka pre vývojárov

- Pre lokálny vývoj použite testovacie credentials z API DEMO
- Pre produkciu použite credentials prijaté emailom po zadaní údajov v systéme
- Produkčné credentials sa **nikdy neukladajú** v kóde, ale v environment variables alebo secrets management systéme

---
