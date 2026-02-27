# Storyous Auto-Print Checklist

Pouzi tento checklist po deployi, aby sa objednavky po synce tlacili bez manualneho klikania.

## 1) Backend nastavenia

- `Storyous enabled = true`
- `Auto sync = true` (ak chces sync pri prechode na stav `PREPARING`)
- `defaultDeliveryLeadMinutes` nastav na start `45`
- `receiptIncludeModifierLines = true`
- `receiptIncludeOrderNumber = true`

## 2) Storyous POS / Backoffice

- Zapni kanal pre online delivery objednavky (merchant/place).
- Zapni auto-accept pre delivery kanal.
- Zapni auto-print pre kitchen printer pre delivery kanal.
- Skontroluj, ze kanal nepouziva manual approval mode.

## 3) Overenie po deployi

1. Vytvor test objednavku bez modifierov.
2. Vytvor test objednavku s default + custom modifiemi.
3. Posli manualne `sync-storyous`.
4. Over:
- Objednavka je v Storyous dashboarde ako dorucenie v case (nie ASAP).
- Blocek obsahuje `#orderNumber`.
- Blocek obsahuje `+` riadky pre modifiere.

## 4) Diagnostika ked netlaci

- Backend log: musi vratit `storyousOrderId`.
- Ak je `storyousOrderId` prazdne, sync zlyhal na API payload/credentials.
- Ak je `storyousOrderId` vyplnene, ale netlaci, problem je POS pravidlo (auto-accept/auto-print).
