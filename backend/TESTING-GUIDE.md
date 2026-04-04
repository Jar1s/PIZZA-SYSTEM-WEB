# 🧪 Backend API Testing Guide

## Quick Start

### 1. Install REST Client Extension

V VS Code nainštaluj rozšírenie **"REST Client"** (autor: Huachao Mao):
- Otvor Extensions (Cmd+Shift+X / Ctrl+Shift+X)
- Vyhľadaj "REST Client"
- Klikni Install

### 2. Otvor test súbor

Otvor súbor `backend/api-test.http` v VS Code.

### 3. Spusti backend

```bash
cd backend
npm run start:dev
```

Backend beží na `http://localhost:3000`

### 4. Testuj endpointy

V súbore `api-test.http`:
- Klikni na **"Send Request"** nad každým requestom
- Výsledok sa zobrazí v paneli vedľa

## 📋 Všetky dostupné endpointy

### Health & Info
- `GET /api/health` - Health check
- `GET /` - API info a zoznam endpointov

### Tenants
- `GET /api/tenants` - Všetci tenanti
- `GET /api/tenants/:slug` - Konkrétny tenant

### Products
- `GET /api/:tenantSlug/products` - Všetky produkty
- `GET /api/:tenantSlug/products?category=PIZZA` - Filtrované podľa kategórie
- `GET /api/:tenantSlug/products/categories` - Zoznam kategórií
- `GET /api/:tenantSlug/products/:id` - Konkrétny produkt

### Delivery Zones
- `POST /api/delivery-zones/:tenantSlug/calculate-fee` - Výpočet delivery fee
  ```json
  {
    "address": {
      "postalCode": "81101",
      "city": "Bratislava",
      "cityPart": "Staré Mesto"
    }
  }
  ```
- `POST /api/delivery-zones/:tenantSlug/validate-min-order` - Validácia minimálnej objednávky
  ```json
  {
    "address": {
      "postalCode": "85108",
      "city": "Bratislava",
      "cityPart": "Jarovce"
    },
    "orderTotalCents": 3500
  }
  ```

### Auth - Customer
- `POST /api/auth/customer/check-email` - Kontrola, či email existuje
- `POST /api/auth/customer/register` - Registrácia nového zákazníka
- `POST /api/auth/customer/login` - Prihlásenie
- `POST /api/auth/customer/set-password` - Nastavenie hesla pomocou tokenu

### Orders
- `POST /api/:tenantSlug/orders` - Vytvorenie objednávky
- `GET /api/:tenantSlug/orders` - Zoznam objednávok (s filtrami)
- `GET /api/:tenantSlug/orders/:id` - Konkrétna objednávka
- `PATCH /api/:tenantSlug/orders/:id/status` - Zmena statusu objednávky

### Customer Account (vyžaduje auth token)
- `GET /api/customer/account/profile` - Profil zákazníka
- `GET /api/customer/account/addresses` - Adresy zákazníka
- `POST /api/customer/account/addresses` - Pridanie adresy
- `GET /api/customer/account/orders` - História objednávok

### Tracking
- `GET /api/track/:orderId` - Public tracking objednávky (bez autentifikácie)

## 🔑 Ako získať auth token

1. **Registrácia alebo login**:
   ```http
   POST /api/auth/customer/login
   Content-Type: application/json

   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```

2. **Z odpovede skopíruj `access_token`**

3. **Použij ho v requestoch**:
   ```http
   @authToken = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   GET /api/customer/account/profile
   Authorization: Bearer {{authToken}}
   ```

## 🧪 Príklady testov

### Test delivery zones

1. **Staré Mesto** (ZADARMO, bez minima):
   ```http
   POST /api/delivery-zones/pornopizza/calculate-fee
   {
     "address": {
       "postalCode": "81101",
       "city": "Bratislava",
       "cityPart": "Staré Mesto"
     }
   }
   ```
   Očakávaný výsledok: `deliveryFeeCents: 0`, `minOrderCents: null`

2. **Jarovce** (ZADARMO, minimum 30€):
   ```http
   POST /api/delivery-zones/pornopizza/calculate-fee
   {
     "address": {
       "postalCode": "85108",
       "city": "Bratislava",
       "cityPart": "Jarovce"
     }
   }
   ```
   Očakávaný výsledok: `deliveryFeeCents: 0`, `minOrderCents: 3000`

3. **Validácia minima** (25€ - malo by zlyhať):
   ```http
   POST /api/delivery-zones/pornopizza/validate-min-order
   {
     "address": {
       "postalCode": "85108",
       "city": "Bratislava",
       "cityPart": "Jarovce"
     },
     "orderTotalCents": 2500
   }
   ```
   Očakávaný výsledok: `valid: false`, `message: "Minimálna objednávka pre ZONA15 - Jarovce je 30.00€"`

### Test vytvorenia objednávky

```http
POST /api/pornopizza/orders
Content-Type: application/json

{
  "customer": {
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "+421912345678"
  },
  "address": {
    "street": "Hlavná 1",
    "city": "Bratislava",
    "postalCode": "81101",
    "country": "SK"
  },
  "items": [
    {
      "productId": "product-id-here",
      "quantity": 2
    }
  ],
  "deliveryFeeCents": 0,
  "paymentMethod": "cash"
}
```

## 🐛 Debugging

### Kontrola logov

Backend loguje všetky requesty do konzoly. Sleduj:
- `[DeliveryZoneController]` - Delivery zone requesty
- `[OrdersController]` - Order requesty
- `[CustomerAuthController]` - Auth requesty

### Časté problémy

1. **404 Not Found**:
   - Skontroluj, či backend beží (`http://localhost:3000/api/health`)
   - Skontroluj, či `tenantSlug` je správny

2. **401 Unauthorized**:
   - Skontroluj, či máš validný auth token
   - Token môže byť expirovaný (platí 1 hodinu)

3. **500 Internal Server Error**:
   - Pozri sa do backend logov
   - Skontroluj, či databáza beží
   - Skontroluj, či sú zóny vytvorené (`npm run prisma:seed-zones`)

## 📝 Poznámky

- Všetky endpointy používajú prefix `/api`
- Tenant slug je v URL: `/api/:tenantSlug/...`
- Pre produkciu zmeň `@baseUrl` v `api-test.http`
- Auth tokeny sa ukladajú do cookies v produkcii (HttpOnly)

