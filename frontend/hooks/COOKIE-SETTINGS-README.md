# Cookie Settings Implementation

## Prehľad

Cookie settings systém umožňuje používateľom kontrolovať, ktoré cookies sa používajú v aplikácii. Implementácia je GDPR-compliant a poskytuje:

- **Necessary cookies** - Vždy povolené (pre fungovanie aplikácie)
- **Analytics cookies** - Voliteľné (Google Analytics, atď.)
- **Marketing cookies** - Voliteľné (Facebook Pixel, Google Ads, atď.)

## Ako to funguje

### 1. Cookie Consent Banner

Pri prvom návšteve sa zobrazí banner na spodku stránky, ktorý umožňuje:
- **Accept All** - Povolí všetky cookies
- **Reject All** - Odmietne všetky voliteľné cookies
- **Customize** - Presmeruje na `/cookies` stránku pre detailné nastavenia

### 2. Cookie Settings Page

Na stránke `/cookies` môžu používatelia:
- Zobraziť aktuálne nastavenia
- Zmeniť nastavenia pre analytics a marketing cookies
- Uložiť zmeny

### 3. Hook `useCookieSettings`

Hook poskytuje jednoduchý spôsob na čítanie a aktualizáciu cookie nastavení:

```typescript
import { useCookieSettings } from '@/hooks/useCookieSettings';

function MyComponent() {
  const { settings, isAnalyticsAllowed, isMarketingAllowed } = useCookieSettings();

  // Skontrolovať, či sú analytics povolené
  if (isAnalyticsAllowed()) {
    // Načítať Google Analytics, atď.
  }

  // Skontrolovať, či sú marketing cookies povolené
  if (isMarketingAllowed()) {
    // Načítať Facebook Pixel, atď.
  }
}
```

## Ako pridať Analytics/Marketing Scripts

### Google Analytics (už implementované)

1. Pridajte do `.env.local`:
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

2. Google Analytics sa automaticky načíta, keď používateľ povolí analytics cookies.

### Facebook Pixel (už implementované)

1. Pridajte do `.env.local`:
```env
NEXT_PUBLIC_FB_PIXEL_ID=XXXXXXXXXX
```

2. Facebook Pixel sa automaticky načíta, keď používateľ povolí marketing cookies.

**Poznámka:** Ak nie sú nastavené environment variables, scripts sa nenačítajú a v konzole sa zobrazí varovanie.

### Vlastné Marketing Scripts

Pridajte do `CookieConsent.tsx` v `useEffect` pre marketing:

```typescript
useEffect(() => {
  if (!isLoaded || !settings.marketing) return;

  // Váš vlastný marketing script
  const script = document.createElement('script');
  script.src = 'https://example.com/tracker.js';
  script.async = true;
  document.head.appendChild(script);
}, [isLoaded, settings.marketing]);
```

## Storage

Cookie nastavenia sa ukladajú do `localStorage`:
- `cookie_analytics` - `"true"` alebo `"false"`
- `cookie_marketing` - `"true"` alebo `"false"`

## GDPR Compliance

- ✅ Používatelia môžu odmietnuť voliteľné cookies
- ✅ Používatelia môžu zmeniť nastavenia kedykoľvek
- ✅ Nevyhnutné cookies sú vždy povolené (pre fungovanie aplikácie)
- ✅ Scripts sa načítavajú len ak sú cookies povolené

## Testovanie

1. Otvorte aplikáciu v inkognito režime
2. Mala by sa zobraziť cookie consent banner
3. Kliknite na "Accept All" alebo "Reject All"
4. Skontrolujte `localStorage` - mali by byť uložené hodnoty
5. Prejdite na `/cookies` a zmeňte nastavenia
6. Skontrolujte, či sa scripts načítavajú len ak sú cookies povolené

