# Prepnutie Woltu na ostrú prevádzku

Systém aktuálne beží proti **testovaciemu prostrediu Wolt Drive**
(`daas-public-api.development.dev.woltapi.com`) — kuriéri sú len simulovaní,
skutočný kuriér nikdy nepríde. Tento návod prepína na ostré prostredie.

## Čo potrebuješ od Woltu (Wolt Drive kontakt / merchant portál)

Produkčné hodnoty (tie testovacie im NIE sú podobné, je to iný účet):

- **API key** (production)
- **Merchant ID** (production)
- **Venue ID** (production)
- **Webhook secret** (ak ho Wolt vyžaduje aj pre produkciu)

## Postup (admin → Settings → Wolt, ~5 minút)

1. V sekcii Wolt uvidíš badge prostredia: 🧪 TESTOVACIE / 🟢 OSTRÉ.
2. Klikni **„Použiť ostré URL"** (predvyplní `https://daas-public-api.wolt.com`).
3. Prepíš **API key**, **Merchant ID**, **Venue ID** na produkčné hodnoty.
4. **Ulož.**
5. Klikni **„Otestovať zóny"** — musí vrátiť `✅ Pripojenie OK — Wolt vrátil N zón`.
   - `⚠️ 0 zón` = kľúč funguje, ale Merchant ID nesedí s prostredím
   - `❌` = zlý API key alebo URL
6. Klikni **„Registrovať webhook"** — Wolt potrebuje produkčnú registráciu
   callbacku (stavy doručení). Over aj, že `WOLT_WEBHOOK_SECRET` v Render env
   (pizza-ecosystem-api) zodpovedá produkčnému secretu.
7. Over checkout: adresa v zóne dostane cenu, adresa mimo (napr. Senec)
   dostane „nedoručujeme".
8. **Testovacia objednávka s ostrým Woltom privolá skutočného kuriéra** —
   počítaj s tým (alebo ju hneď stornuj cez admin, pozri smoke-tests.md).

## Návrat na testovacie prostredie

Rovnaký postup s tlačidlom **„Použiť testovacie URL"** + testovacie kľúče.
Testovacie hodnoty si pred prepnutím niekam ulož (napr. password manager) —
admin ich prepísaním stratí.

## Poznámky

- **API key musí byť vytvorený po novembri 2025** — endpoint delivery-areas
  (tlačidlo „Otestovať zóny") so starším tokenom nefunguje. Ak produkčný kľúč
  existuje dlhšie, vypýtaj si od Woltu nový.

- Zóny sa kešujú ~10 minút; po prepnutí ich „Otestovať zóny" obnoví okamžite.
- Checkout blokuje adresy mimo zóny len keď Wolt vráti jasné „mimo";
  pri výpadku Wolt API prepúšťa (fail-open) a platí post-payment poistka
  s Telegram alertom.
