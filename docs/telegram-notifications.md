# Telegram notifications

Backend vie posielat prevadzkove reporty do Telegram chatu cez bota.

## Env premmenne

```env
TELEGRAM_BOT_TOKEN=123456:telegram-token
TELEGRAM_CHAT_ID=123456789
TELEGRAM_ENABLED=true
TELEGRAM_NOTIFY_STARTUP=true
TELEGRAM_NOTIFY_ORDERS=true
TELEGRAM_NOTIFY_STATUS_CHANGES=true
TELEGRAM_NOTIFY_ERRORS=true
```

Ak `TELEGRAM_BOT_TOKEN` alebo `TELEGRAM_CHAT_ID` nie su nastavene, notifikacie sa ticho preskocia.

## Co sa posiela

- start backendu
- nova objednavka s tenantom, zakaznikom, adresou, polozkami, platbou a sumami
- zmena statusu objednavky
- Storyous sync a auto-sync chyby
- necakane backend chyby s HTTP statusom, URL, spravou a skratkou stack trace

## Ako ziskat token a chat ID

1. V Telegrame otvor `@BotFather`.
2. Vytvor bota cez `/newbot`.
3. Skopiruj `BOT_TOKEN`.
4. Posli botovi lubovolnu spravu.
5. Otvor `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`.
6. V odpovedi najdi `message.chat.id` a pouzi ho ako `TELEGRAM_CHAT_ID`.

Pre skupinovy chat pridaj bota do skupiny, posli spravu do skupiny a potom znova pozri `getUpdates`.
