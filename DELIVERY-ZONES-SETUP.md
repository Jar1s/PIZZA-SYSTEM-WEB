# 🗺️ Delivery Zones - Nastavenie zón pre dopravu

## Ako funguje mapovanie zón

Systém mapuje adresy na zóny pomocou **3 spôsobov** (v poradí priority):

1. **PSČ (postalCodes)** - najpresnejšie mapovanie
2. **Názvy miest (cityNames)** - napr. "Bratislava"
3. **Časti mesta (cityParts)** - napr. "Jarovce", "Staré Mesto", "Petržalka"

### Priority systém

- Zóny sa kontrolujú podľa **priority** (vyššia = skoršie)
- Prvá zóna, ktorá sa zhoduje s adresou, sa použije
- Preto **Jarovce má priority 20** (najvyššia) - kontroluje sa najskôr

## Vytvorené zóny pre Bratislavu

Po spustení seed scriptu budú vytvorené **17 zón** pokrývajúcich všetky mestské časti Bratislavy:

### 🟢 Zóny s 1€ dopravou
- **ZONA1 - Staré Mesto:** PSČ 81101-81109, bez minima

### 🟡 Zóny s 2€ dopravou
- **ZONA2 - Petržalka:** PSČ 85101-85107, bez minima
- **ZONA3 - Ružinov:** PSČ 82101-82109 (Nivy, Pošeň, Ostredky, Trávniky, Štrkovec, Vlčie hrdlo, Trnávka), bez minima
- **ZONA4 - Nové Mesto:** PSČ 83101-83108 (Ahoj, Jurajov dvor, Koliba, Kramáre, Pasienky, Vinohrady), bez minima

### 🟠 Zóny s 3€ dopravou
- **ZONA5 - Karlova Ves:** PSČ 84101-84105, bez minima
- **ZONA6 - Dúbravka:** PSČ 84106-84108, bez minima
- **ZONA7 - Rača:** PSČ 83109-83112 (Krasňany, Východné, Žabí majer), bez minima
- **ZONA8 - Vrakuňa:** PSČ 82110-82112 (Dolné hony), bez minima
- **ZONA9 - Podunajské Biskupice:** PSČ 82113-82115 (Ketelec, Lieskovec, Medzi jarkami), bez minima

### 🔴 Zóny s 4€ dopravou
- **ZONA10 - Lamač:** PSČ 84109-84110, bez minima
- **ZONA11 - Devín:** PSČ 84111-84112, bez minima
- **ZONA12 - Devínska Nová Ves:** PSČ 84113-84114, bez minima
- **ZONA13 - Záhorská Bystrica:** PSČ 84115-84116, bez minima
- **ZONA14 - Vajnory:** PSČ 83113-83114, bez minima

### ⚫ Zóny s 5€ dopravou a minimom 30€
- **ZONA15 - Jarovce:** PSČ 85108-85109, minimum 30€
- **ZONA16 - Rusovce:** PSČ 85110-85111, minimum 30€
- **ZONA17 - Čunovo:** PSČ 85112-85113, minimum 30€

## Ako spustiť seed

```bash
cd backend
npm run prisma:seed-zones
```

## Ako upraviť zóny

### 1. Pridanie novej zóny

```typescript
await prisma.deliveryZone.create({
  data: {
    tenantId: tenant.id,
    name: 'ZONA6',
    deliveryFeeCents: 600, // 6€
    minOrderCents: 5000, // 50€ minimum (alebo null pre bez minima)
    postalCodes: ['81201', '81202'], // PSČ
    cityNames: ['Bratislava'], // Názvy miest
    cityParts: ['Devín'], // Časti mesta
    isActive: true,
    priority: 15, // Vyššia priorita = skoršie kontrolovanie
  },
});
```

### 2. Upravenie existujúcej zóny

```typescript
await prisma.deliveryZone.update({
  where: { id: 'zona1-stare-mesto' },
  data: {
    deliveryFeeCents: 150, // Zmeniť na 1.50€
    minOrderCents: 1000, // Pridať minimum 10€
  },
});
```

### 3. Deaktivácia zóny

```typescript
await prisma.deliveryZone.update({
  where: { id: 'zona1-stare-mesto' },
  data: {
    isActive: false,
  },
});
```

## Príklady mapovania

### Príklad 1: Staré Mesto
- **Adresa:** PSČ 81101, Mesto: Bratislava
- **Výsledok:** ZONA1 (1€ doprava, bez minima)
- **Dôvod:** PSČ 81101 je v postalCodes ZONA1

### Príklad 2: Jarovce
- **Adresa:** Mesto: Bratislava, Časť: Jarovce
- **Výsledok:** ZONA15 (5€ doprava, minimum 30€)
- **Dôvod:** "Jarovce" je v cityParts ZONA15, ktorá má najvyššiu priority (30)

### Príklad 3: Petržalka
- **Adresa:** PSČ 85101, Mesto: Bratislava
- **Výsledok:** ZONA2 (2€ doprava, bez minima)
- **Dôvod:** PSČ 85101 je v postalCodes ZONA2

## Dôležité poznámky

1. **Priority systém:**
   - Vyššia priority = skoršie kontrolovanie
   - Vzdialené zóny (Jarovce, Rusovce, Čunovo) majú priority 30 (najvyššia) - kontrolujú sa pred ostatnými
   - Všetky ostatné zóny majú priority 20
   - Ak by vzdialená zóna mala nižšiu priority, mohla by sa zhodovať s inou zónou najprv

2. **Mapovanie:**
   - PSČ je najpresnejšie (napr. 81101 = Staré Mesto)
   - cityPart je užitočné pre špecifické časti (napr. "Jarovce")
   - cityName je všeobecné (napr. "Bratislava")

3. **Minimum objednávky:**
   - `null` = bez minima
   - `3000` = minimum 30€ (v centoch)
   - Validácia sa deje automaticky v checkoutu

4. **Aktivácia/Deaktivácia:**
   - `isActive: false` = zóna sa nepoužije
   - Užitočné pre dočasné vypnutie zóny

## Testovanie

Po vytvorení zón môžete testovať pomocou API:

```bash
# Test výpočtu delivery fee
curl -X POST http://localhost:3000/api/delivery-zones/pornopizza/calculate-fee \
  -H "Content-Type: application/json" \
  -d '{
    "address": {
      "postalCode": "81101",
      "city": "Bratislava"
    }
  }'

# Očakávaný výsledok:
# {
#   "available": true,
#   "deliveryFeeCents": 100,
#   "deliveryFeeEuros": "1.00",
#   "minOrderCents": null,
#   "minOrderEuros": null,
#   "zoneName": "ZONA1"
# }
```

