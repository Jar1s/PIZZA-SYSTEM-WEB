# Slack notifications

Backend posiela prevadzkove reporty do Slack kanala cez Slack Web API (`chat.postMessage`),
rovnakou Slack app ako `ls-marketing-specialist` na VPS. Alternativa je Incoming Webhook.

## Env premenne

```env
SLACK_BOT_TOKEN=xoxb-...        # scope chat:write (+ chat:write.public pre verejne kanaly bez pozvania)
SLACK_CHANNEL=C0XXXXXXXXX       # ID kanala (alebo #nazov)
SLACK_WEBHOOK_URL=              # fallback, ak nie je bot token + kanal
SLACK_ENABLED=true
SLACK_NOTIFY_STARTUP=true
SLACK_NOTIFY_ORDERS=true
SLACK_NOTIFY_STATUS_CHANGES=true
SLACK_NOTIFY_ERRORS=true
```

Poradie: ak su `SLACK_BOT_TOKEN` aj `SLACK_CHANNEL`, pouzije sa Web API. Inak `SLACK_WEBHOOK_URL`.
Ak nie je nic, notifikacie sa ticho preskocia.

## Co sa posiela

- start backendu
- nova objednavka s tenantom, zakaznikom, adresou, polozkami, platbou a sumami
- zmena statusu objednavky
- Storyous sync a auto-sync chyby
- necakane backend chyby s HTTP statusom, URL, spravou a skratkou stack trace

Rovnaky bot pouziva aj GitHub Actions `health-watchdog`
(repo secrets `SLACK_BOT_TOKEN`, `SLACK_CHANNEL`).

## Odkial vziat hodnoty

Bot token je uz vytvoreny pre `ls-marketing-specialist` — na VPS v `/opt/ls-marketing-specialist/.env`
ako `LS_SLACK_BOT_TOKEN`. Pre pizzu vytvor v Slacku samostatny kanal (napr. `#pizza-ops`),
pozvi don bota (`/invite @<bot>`) a pouzi ID kanala ako `SLACK_CHANNEL`.

Token je tajomstvo — nikdy do repa ani do chatu. Nastavuje sa v Render (backend)
a v GitHub repo secrets (watchdog).
