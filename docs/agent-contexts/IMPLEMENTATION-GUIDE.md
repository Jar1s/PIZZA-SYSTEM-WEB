# 🚀 Implementation Guide - SMS Verification & WePay

## 📋 Čo bolo vytvorené

Vytvorili sme presné prompty pre implementáciu dvoch features:

1. **SMS Verifikácia pri prvom prihlásení** → Agent 12
2. **WePay platobná brána** → Agent 5 (rozšírenie)

---

## ✅ Čo už je hotové (nemusíte robiť nič)

- ✅ **Email potvrdenie objednávky s tracking linkom** - už hotové (Agent 4)
- ✅ **Login - databáza** - už hotové (Agent 2)

---

## 🎯 Čo musíte urobiť

### 1. SMS Verifikácia (Agent 12)

**Krok 1:** Otvorte súbor:
```
/docs/agent-contexts/AGENT-12-SMS-VERIFICATION.md
```

**Krok 2:** Skopírujte celý obsah súboru (Cmd+A, Cmd+C)

**Krok 3:** Otvorte nový Cursor chat (Cmd+Shift+N)

**Krok 4:** Vložte prompt do chatu (Cmd+V)

**Krok 5:** Agent začne implementovať SMS verifikáciu

---

### 2. WePay Platba (Agent 5)

**Krok 1:** Otvorte súbor:
```
/docs/agent-contexts/AGENT-05-PAYMENTS-WEPAY.md
```

**Krok 2:** Skopírujte celý obsah súboru (Cmd+A, Cmd+C)

**Krok 3:** Otvorte existujúci Agent 5 chat alebo nový chat

**Krok 4:** Vložte prompt do chatu (Cmd+V)

**Krok 5:** Agent pridá WePay do platobnej brány

---

## 📁 Súbory s promptmi

### Agent 12 - SMS Verifikácia
```
/docs/agent-contexts/AGENT-12-SMS-VERIFICATION.md
```

**Obsahuje:**
- Backend: SMS service
- Backend: API endpoints
- Backend: Database schema updates
- Frontend: SMS verification page
- Frontend: Login flow integration
- Kompletné code examples

### Agent 5 - WePay Platba
```
/docs/agent-contexts/AGENT-05-PAYMENTS-WEPAY.md
```

**Obsahuje:**
- Backend: WePay service (placeholder)
- Backend: Payment provider switch update
- Backend: Webhook handler
- Frontend: Checkout integration
- Frontend: Mock payment page
- Kompletné code examples

---

## 🧪 Testovanie po implementácii

### SMS Verifikácia
1. Login s používateľom bez telefónneho čísla
2. Mala by sa zobraziť SMS verifikácia
3. Zadajte telefónne číslo
4. Skontrolujte konzolu pre SMS kód (dev mode)
5. Zadajte kód
6. Login by mal byť dokončený

### WePay Platba
1. Vytvorte objednávku cez checkout
2. Mala by sa zobraziť redirect na WePay (mock v dev mode)
3. Kliknite na "Simulate Successful Payment"
4. Mala by sa zobraziť success stránka
5. Skontrolujte, že objednávka má status PAID

---

## 📝 Poznámky

### SMS Verifikácia
- V dev mode: SMS kódy sa logujú do konzoly
- V production: treba integrovať SMS provider (Twilio, MessageBird, etc.)
- Kódy expirujú po 10 minútach
- Kódy sa dajú znovu poslať po 60 sekundách

### WePay Platba
- V dev mode: používa sa mock redirect URL
- V production: treba pridať WePay credentials
- Webhook verification sa dá preskočiť v dev mode
- Mock payment page umožňuje testovanie bez credentials

---

## 🎉 Po dokončení

Každý agent vytvorí completion súbor:
- Agent 12: `/backend/src/auth/AGENT-12-COMPLETE.md`
- Agent 5: Aktualizuje `/backend/src/payments/AGENT-5-COMPLETE.md`

---

## 🆘 Ak niečo nefunguje

1. Skontrolujte, či sú všetky dependencies hotové
2. Skontrolujte, či sú všetky súbory vytvorené
3. Skontrolujte konzolu pre chyby
4. Skontrolujte database migrations

---

**Všetko je pripravené! Stačí skopírovať prompty a začať implementáciu.** 🚀

