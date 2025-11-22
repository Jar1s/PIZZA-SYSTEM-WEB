# 📦 Storyous API Integration

Tento dokument popisuje integráciu s Storyous API pre automatické posielanie objednávok a synchronizáciu statusov.

## 🎯 Funkcionalita

1. **Automatické posielanie objednávok**: Keď sa vytvorí nová objednávka v systéme, automaticky sa pošle do Storyous (ak je integrácia zapnutá pre daného tenanta).

2. **Synchronizácia statusov**: Keď sa zmení status objednávky v admin dashboarde, automaticky sa aktualizuje aj v Storyous.

3. **Manuálne posielanie**: V admin dashboarde je možné manuálne poslať objednávku do Storyous pomocou tlačidla "📦 Storyous".

## ⚙️ Konfigurácia

### 1. Environment Variables

Pridajte do `backend/.env`:

```env
# Storyous API Credentials
STORYOUS_CLIENT_ID=your_client_id
STORYOUS_CLIENT_SECRET=your_client_secret
STORYOUS_ENABLED=true
```

### 2. Tenant Configuration

Pre každého tenanta (PornoPizza, Pizza v Núdzi) musíte nastaviť Storyous konfiguráciu v databáze:

```sql
UPDATE tenants 
SET "storyousConfig" = jsonb_build_object(
  'enabled', true,
  'merchantId', 'your_merchant_id',
  'placeId', 'your_place_id'
)
WHERE slug = 'pornopizza';
```

Alebo cez Prisma Studio:
1. Otvorte Prisma Studio: `npx prisma studio`
2. Nájdite tenant (napr. `pornopizza`)
3. Upravte pole `storyousConfig`:
   ```json
   {
     "enabled": true,
     "merchantId": "your_merchant_id",
     "placeId": "your_place_id"
   }
   ```

## 📋 API Endpoints

### Backend Endpoints

- `POST /api/:tenantSlug/orders/:id/sync-storyous` - Manuálne poslanie objednávky do Storyous

### Storyous API Endpoints (používané interné)

- `POST https://login.storyous.com/api/auth/authorize` - Získanie access tokenu
- `POST https://api.storyous.com/delivery/orders` - Vytvorenie objednávky
- `PATCH https://api.storyous.com/delivery/orders/:id/status` - Aktualizácia statusu

## 🔄 Flow

### Automatické posielanie objednávky

1. Zákazník vytvorí objednávku cez frontend
2. `OrdersService.createOrder()` vytvorí objednávku v databáze
3. Automaticky sa zavolá `StoryousService.createOrder()`
4. Ak je integrácia zapnutá a konfigurácia správna, objednávka sa pošle do Storyous
5. `storyousOrderId` sa uloží do databázy

### Synchronizácia statusov

1. Admin zmení status objednávky v dashboarde
2. `OrderStatusService.updateStatus()` aktualizuje status v databáze
3. Automaticky sa zavolá `StoryousService.updateOrderStatus()`
4. Status sa aktualizuje aj v Storyous

### Manuálne posielanie

1. Admin klikne na tlačidlo "📦 Storyous" v OrderCard
2. Frontend zavolá `POST /api/:tenantSlug/orders/:id/sync-storyous`
3. Backend zavolá `StoryousService.createOrder()`
4. Výsledok sa zobrazí používateľovi

## 🗄️ Database Schema

Pridané pole do `Order` modelu:

```prisma
model Order {
  // ...
  storyousOrderId String?
  // ...
}
```

## 🎨 Frontend UI

### OrderCard Component

- **Tlačidlo "📦 Storyous"**: Zobrazí sa len ak objednávka ešte nebola poslaná do Storyous
- **Badge "📦 Storyous"**: Zobrazí sa ak objednávka už bola poslaná
- **Status message**: Zobrazí sa po úspešnom/neúspešnom poslaní

### Indikátory

- 🟢 **Zelený badge**: Objednávka je synchronizovaná s Storyous
- 🟣 **Fialové tlačidlo**: Manuálne poslanie do Storyous
- ⏳ **Loading state**: Počas posielania

## 🔍 Status Mapping

| Náš Status | Storyous Status |
|------------|-----------------|
| PENDING | pending |
| PAID | paid |
| PREPARING | preparing |
| READY | ready |
| OUT_FOR_DELIVERY | out_for_delivery |
| DELIVERED | delivered |
| CANCELED | cancelled |

## 🐛 Error Handling

- Ak zlyhá posielanie do Storyous pri vytváraní objednávky, objednávka sa stále vytvorí (chyba sa len zaloguje)
- Ak zlyhá aktualizácia statusu v Storyous, status sa stále aktualizuje v našom systéme (chyba sa len zaloguje)
- Všetky chyby sa logujú do backend logov s prefixom `[StoryousService]`

## 📝 Logging

Backend loguje:
- `✅ Order {id} synchronized to Storyous: {storyousOrderId}` - Úspešné poslanie
- `⚠️ Failed to sync order {id} to Storyous: {error}` - Chyba pri posielaní
- `✅ Storyous order {id} status updated to {status}` - Úspešná aktualizácia statusu
- `❌ Failed to update Storyous order status: {error}` - Chyba pri aktualizácii

## 🧪 Testing

1. Vytvorte testovaciu objednávku cez frontend
2. Skontrolujte backend logy, či sa objednávka poslala do Storyous
3. Skontrolujte Storyous dashboard, či sa objednávka zobrazuje
4. Zmeňte status objednávky v admin dashboarde
5. Skontrolujte, či sa status aktualizoval aj v Storyous

## 📚 Dokumentácia Storyous API

Oficiálna dokumentácia: https://docs.api.storyous.com/

## 🔐 Security

- Access tokeny sa cachujú a automaticky obnovujú pred expiráciou (5 minútový buffer)
- Client credentials sa ukladajú v environment variables
- Storyous konfigurácia pre každého tenanta je v databáze (JSON field)









