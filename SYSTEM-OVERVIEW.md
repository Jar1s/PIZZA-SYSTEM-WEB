# 🍕 System Overview - Ako funguje kód

**Posledná aktualizácia**: Dnes (po pridání Build Your Own Pizza a Best Sellers)

---

## 🎯 Čo systém robí

Multi-tenant pizza ordering platforma, ktorá podporuje viacero značiek (PornoPizza, Pizza v Núdzi) s jedným backendom a frontendom.

---

## 🏗️ Architektúra

```
┌─────────────────────────────────────────────────┐
│         Frontend (Next.js 14)                  │
│  - PornoPizza (pornopizza.localhost:3001)     │
│  - Pizza v Núdzi (pizzavnudzi.localhost:3001) │
│  - Admin Dashboard (/admin)                    │
│  - Order Tracking (/order/[id])                │
└─────────────────┬───────────────────────────────┘
                  │ HTTP REST API
┌─────────────────▼───────────────────────────────┐
│      Backend API (NestJS)                     │
│  - Multi-tenant endpoints                      │
│  - Orders, Products, Tenants                   │
│  - Payments (Adyen/GoPay/WePay)               │
│  - Delivery (Wolt Drive)                      │
│  - Email notifications                         │
└─────────────────┬───────────────────────────────┘
                  │ Prisma ORM
┌─────────────────▼───────────────────────────────┐
│      PostgreSQL Database                        │
│  - Tenants (multi-brand config)                │
│  - Products (67 items per tenant)              │
│  - Orders (with status tracking)               │
│  - Customers (auth & addresses)                 │
└─────────────────────────────────────────────────┘
```

---

## 📦 Hlavné komponenty

### 1. **Frontend (Next.js 14)**

**Hlavné stránky:**
- `/` - Hlavná stránka s menu
  - Hero sekcia s call-to-action
  - Best Sellers sekcia (top 4 pizze)
  - Kompletné menu s kategóriami
  - "Vyskladaj si vlastnú pizzu" (prvá v menu)
- `/checkout` - Checkout proces
  - Výber adresy
  - Platba cez Adyen/GoPay
- `/order/[id]` - Sledovanie objednávky
- `/admin` - Admin dashboard

**Hlavné komponenty:**
- `ProductCard` - Zobrazuje produkt s možnosťou pridať do košíka
- `CustomizationModal` - Modal pre vlastnú pizzu (cesto, syr, základ, prílohy)
- `Cart` - Košík s možnosťou upraviť množstvo
- `Header` - Header s košíkom a language switcher
- `HeroSection` - Hero sekcia s informáciami

**State management:**
- Zustand pre košík (persist v localStorage)
- React Context pre language a auth

### 2. **Backend (NestJS)**

**Hlavné moduly:**
- `TenantsModule` - Multi-tenant management
- `ProductsModule` - Produkty a kategórie
- `OrdersModule` - Objednávky a status tracking
- `PaymentsModule` - Platobná brána (Adyen/GoPay/WePay)
- `DeliveryModule` - Wolt Drive integrácia
- `CustomerModule` - Zákaznícka autentifikácia

**API Endpoints:**
- `GET /api/:tenantSlug/products` - Zoznam produktov
- `POST /api/:tenantSlug/orders` - Vytvorenie objednávky
- `POST /api/payments/session` - Vytvorenie payment session
- `GET /api/track/:orderId` - Sledovanie objednávky
- `POST /api/webhooks/adyen` - Adyen webhook

### 3. **Database (PostgreSQL + Prisma)**

**Hlavné tabuľky:**
- `tenants` - Značky (PornoPizza, Pizza v Núdzi)
- `products` - Produkty (67 items per tenant)
- `orders` - Objednávky s status tracking
- `order_items` - Položky v objednávke
- `customers` - Zákazníci s adresami

---

## 🔄 Ako funguje flow

### 1. **Objednávka pizze**

```
Zákazník → Vyberie pizzu → Klikne "Pridať"
  ↓
CustomizationModal (ak je pizza)
  ↓
Vyberie cesto, syr, základ, prílohy
  ↓
Pridá do košíka (Zustand store)
  ↓
Prejde na checkout
  ↓
Vyplní adresu a údaje
  ↓
Vytvorí objednávku (POST /api/:tenant/orders)
  ↓
Vytvorí payment session (POST /api/payments/session)
  ↓
Presmeruje na Adyen checkout
  ↓
Zaplatí
  ↓
Adyen webhook → Aktualizuje status na PAID
  ↓
Automaticky vytvorí delivery (Wolt Drive)
```

### 2. **Build Your Own Pizza**

```
Zákazník → Klikne na "Vyskladaj si vlastnú pizzu"
  ↓
CustomizationModal sa otvorí
  ↓
Vyberie:
  - Cesto (povinné, max 1)
  - Syr (povinné, max 1)
  - Základ (povinné, max 1)
  - Prílohy (voliteľné, max 10)
  ↓
Cena sa počíta dynamicky:
  Základná cena (€7.99) + príplatky za výbery
  ↓
Pridá do košíka s customizations
  ↓
V checkout sa zobrazí ako "Vyskladaj si vlastnú pizzu"
```

### 3. **Best Sellers**

```
Načítajú sa všetky pizze z kategórie PIZZA
  ↓
Filtruje sa "Vyskladaj si vlastnú pizzu" (preskočí sa)
  ↓
Zobrazí sa prvých 4 pizze
  ↓
Zobrazí sa v sekcii medzi Hero a Menu
```

---

## 🎨 Design & Styling

### **PornoPizza**
- Skin-tone background s animovaným patternom
- Crimson red (#DC143C) ako primary color
- Sexual symbols v pozadí (subtle, opacity 0.6)
- Animované gradienty

### **Ostatné značky**
- Biele pozadie
- Orange/red primary color
- Čistý, minimalistický design

---

## 🔧 GitHub Actions CI/CD

### **Backend Workflow** (`.github/workflows/deploy-backend.yml`)

**Čo robí:**
1. **Test Job:**
   - Inštaluje dependencies
   - Generuje Prisma Client
   - Spúšťa migrácie
   - Type check (build)
   - Spúšťa testy

2. **Deploy Job:**
   - Deploy na Fly.io
   - Používa `FLY_API_TOKEN` secret

**Kedy sa spustí:**
- Push na `main` branch
- Pull request na `main` branch

### **Frontend Workflow** (`.github/workflows/deploy-frontend.yml`)

**Čo robí:**
1. **Deploy Job:**
   - Inštaluje dependencies
   - Type check
   - Lint (s `|| true` - neblokuje pri chybách)
   - Build Next.js aplikácie
   - Deploy na Vercel

**Kedy sa spustí:**
- Push na `main` branch
- Pull request na `main` branch

**Čo vidíš v Actions:**
- ✅ Zelený checkmark = úspešný deployment
- ❌ Červený X = zlyhanie
- 🟡 Žltý kruh = prebieha
- Čas spustenia
- Dĺžka behu
- Commit hash a správa
- Branch (main)

---

## 📊 Aktuálny stav systému

### ✅ **Hotové a funkčné:**

1. **Produkty:**
   - 67 produktov pre PornoPizza
   - Kategórie: PIZZA, STANGLE, SOUPS, DRINKS, DESSERTS, SAUCES
   - "Vyskladaj si vlastnú pizzu" s customization

2. **Frontend:**
   - Multi-tenant routing
   - Košík s persist
   - Customization modal
   - Checkout flow
   - Order tracking
   - Language switcher (SK/EN)
   - Best Sellers sekcia

3. **Backend:**
   - Multi-tenant API
   - Order management
   - Payment integration (Adyen/GoPay/WePay)
   - Delivery integration (Wolt)
   - Email notifications

4. **CI/CD:**
   - GitHub Actions workflows
   - Automatický deploy na push
   - Testy a type checking

### ⏳ **Potrebuje konfiguráciu:**

1. **Payment Gateway:**
   - Adyen TEST účet
   - API kľúče
   - Webhook konfigurácia
   - (Pozri: `PAYMENT-SETUP-GUIDE.md`)

2. **Delivery:**
   - Wolt Drive API kľúče
   - Merchant IDs

3. **Email:**
   - SMTP konfigurácia

---

## 🚀 Deployment

### **Backend (Fly.io)**
- URL: `https://pizza-ecosystem-api.fly.dev`
- Automatický deploy pri push na `main`
- PostgreSQL databáza na Fly.io

### **Frontend (Vercel)**
- URL: `https://pornopizza.sk` (alebo iné domény)
- Automatický deploy pri push na `main`
- Preview deployments pre PRs

---

## 📝 Ako vidieť aktuálny stav v Actions

1. **Choď na GitHub:**
   ```
   https://github.com/Jar1s/PIZZA-SYSTEM-WEB/actions
   ```

2. **Uvidíš:**
   - Zoznam workflow runs (najnovšie hore)
   - Status (✅ zelený = úspech, ❌ červený = chyba)
   - Commit správa
   - Čas spustenia
   - Dĺžka behu

3. **Klikni na workflow run:**
   - Uvidíš detaily každého kroku
   - Logy z build procesu
   - Chyby (ak nejaké sú)

4. **Pre Backend:**
   - Test job → Type check, testy
   - Deploy job → Deploy na Fly.io

5. **Pre Frontend:**
   - Deploy job → Build a deploy na Vercel

---

## 🔍 Debugging

### **Ak deployment zlyhá:**

1. **Pozri si logy v Actions:**
   - Klikni na failed workflow
   - Pozri si chyby v jednotlivých krokoch

2. **Časté problémy:**
   - Chýbajúce environment variables
   - TypeScript chyby
   - Test failures
   - Build errors

3. **Lokálne testovanie:**
   ```bash
   # Backend
   cd backend
   npm run build  # Type check
   npm test       # Testy
   
   # Frontend
   cd frontend
   npm run type-check  # Type check
   npm run build      # Build
   ```

---

## 📚 Dokumentácia

- **README.md** - Hlavný prehľad projektu
- **PAYMENT-SETUP-GUIDE.md** - Návod na nastavenie platobnej brány
- **docs/DEPLOYMENT.md** - Deployment guide
- **docs/LOCAL_SETUP.md** - Lokálne nastavenie
- **frontend/ARCHITECTURE.md** - Frontend architektúra

---

**Status**: ✅ Production Ready (s výnimkou payment konfigurácie)

**Posledná aktualizácia**: Dnes - Build Your Own Pizza, Best Sellers, opravy UI

