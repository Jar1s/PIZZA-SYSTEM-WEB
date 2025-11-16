# 🔧 Oprava Admin Dashboard - Analytics

## Problém
Analytics stránka zobrazuje "No analytics data available" pretože endpoint `/api/analytics/all` vracia 404.

## Príčina
V `analytics.controller.ts` bol duplicitný prefix `api/` - keďže `main.ts` už má globálny prefix `api`, skutočná cesta bola `/api/api/analytics/all`.

## ✅ Oprava
Zmenené v `backend/src/analytics/analytics.controller.ts`:
```typescript
// PRED:
@Controller('api/analytics')

// PO:
@Controller('analytics')
```

## 🚀 Ako aplikovať

### 1. Reštartovať backend
```bash
# Zastaviť aktuálny backend (Ctrl+C v termináli kde beží)
# Alebo:
lsof -ti:3000 | xargs kill -9

# Spustiť znova:
cd backend
npm run start:dev
```

### 2. Overiť, že funguje
```bash
curl http://localhost:3000/api/analytics/all?days=30
```

Malo by vrátiť JSON s analytics dátami namiesto 404.

### 3. Obnoviť stránku v prehliadači
Otvoriť `http://localhost:3001/admin/analytics` a obnoviť stránku (F5).

## 📝 Poznámka
Iné controllery môžu mať rovnaký problém:
- `auth.controller.ts` - `@Controller('api/auth')`
- `payments.controller.ts` - `@Controller('api/payments')`
- `delivery.controller.ts` - `@Controller('api/delivery')`

Tieto by mali fungovať, pretože sú registrované pred nastavením globálneho prefixu, ale pre konzistenciu by sa mali opraviť tiež.

