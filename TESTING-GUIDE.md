# Testing Guide - Ako vidieť všetky testy

## 📍 Kde nájsť testy

### 1. **Frontend Unit Testy (Vitest)** - VS Code Testing Panel ✅
Tieto testy sa zobrazujú v **VS Code Testing paneli** (ikona flasky v sidebar):

```
frontend/
├── components/
│   ├── checkout/__tests__/checkout-validation.test.tsx  ✅ NOVÝ
│   ├── cart/__tests__/Cart.test.tsx
│   ├── cart/__tests__/CartItem.test.tsx
│   ├── menu/__tests__/ProductCard.test.tsx
│   └── menu/__tests__/CustomizationModal.test.tsx
├── hooks/__tests__/
│   ├── useCart.test.ts
│   └── useCartTotal.test.ts
├── lib/__tests__/
│   └── tenant-utils.test.ts
└── __tests__/integration/
    └── cart-flow.test.tsx
```

**Ako spustiť:**
- V VS Code: Klikni na ikonu flasky v sidebar → uvidíš všetky testy
- V termináli: `cd frontend && npm test`

### 2. **Backend Testy (Jest)** - Terminál alebo Jest Extension ⚠️
Tieto testy sa **NEZOBRAZUJÚ** v VS Code Testing paneli (ten je len pre Vitest):

```
backend/src/
├── orders/orders.service.spec.ts          ✅ NOVÝ
├── payments/payments.service.spec.ts       ✅ NOVÝ
└── auth/
    ├── customer-auth.service.spec.ts
    └── customer-auth.controller.spec.ts
```

**Ako spustiť:**
- V termináli: `cd backend && npm test`
- Alebo nainštaluj Jest extension pre VS Code

### 3. **E2E Testy (Playwright)** - Playwright Extension alebo Terminál 🎭
Tieto testy majú **vlastný systém** a nezobrazujú sa v VS Code Testing paneli:

```
frontend/e2e/
├── cart-checkout-flow.spec.ts      ✅ NOVÝ
├── checkout-validation.spec.ts     ✅ NOVÝ
└── performance.spec.ts              ✅ NOVÝ
```

**Ako spustiť:**
- V termináli: `cd frontend && npm run test:e2e`
- Alebo nainštaluj Playwright extension pre VS Code
- Alebo: `npx playwright test --ui` (Playwright UI)

## 🔄 Ako obnoviť VS Code Testing Panel

Ak nevidíš nové testy v VS Code:

1. **Reštart VS Code** (najjednoduchšie)
2. **Obnoviť testy:**
   - Klikni na ikonu flasky v sidebar
   - Klikni na ikonu refresh (↻) v Testing paneli
3. **Manuálne spustiť:**
   ```bash
   cd frontend
   npm test -- --run
   ```

## 📊 Súhrn testov

### Frontend (Vitest) - VS Code Testing Panel ✅
- ✅ 121 testov (ako vidíš na obrázku)
- ✅ Všetky unit testy pre komponenty a hooks
- ✅ **NOVÝ:** `checkout-validation.test.tsx`

### Backend (Jest) - Terminál ⚠️
- ✅ **NOVÝ:** `orders.service.spec.ts` (11 testov)
- ✅ **NOVÝ:** `payments.service.spec.ts` (10 testov)
- ✅ Existujúce auth testy

### E2E (Playwright) - Playwright UI 🎭
- ✅ **NOVÝ:** `cart-checkout-flow.spec.ts` (4 testy)
- ✅ **NOVÝ:** `checkout-validation.spec.ts` (8 testov)
- ✅ **NOVÝ:** `performance.spec.ts` (6 testov)

## 🚀 Rýchle spustenie všetkých testov

```bash
# Frontend unit testy
cd frontend && npm test

# Backend testy
cd backend && npm test

# E2E testy
cd frontend && npm run test:e2e

# E2E testy s UI
cd frontend && npm run test:e2e:ui
```

## 💡 Tip

Ak chceš vidieť **všetky testy na jednom mieste**, použij:
- **VS Code Testing Panel** - len frontend unit testy (Vitest)
- **Terminál** - backend testy (Jest)
- **Playwright UI** - E2E testy (`npx playwright test --ui`)






