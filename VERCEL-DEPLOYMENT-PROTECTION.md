# Vypnutí Vercel Deployment Protection

## Problém
Vercel Deployment Protection blokuje všechny požadavky (včetně OPTIONS preflight) před tím, než se dostanou k NestJS aplikaci. To způsobuje CORS chyby, protože CORS hlavičky se nikdy nepřidají.

## Řešení

### Možnost 1: Vypnout Deployment Protection (Doporučeno)

1. Otevřete Vercel Dashboard: https://vercel.com/dashboard
2. Vyberte projekt **backend**
3. Přejděte na **Settings** → **Deployment Protection**
4. Vypněte **Deployment Protection** nebo nastavte na **Public**

### Možnost 2: Použít Protection Bypass Token

Pokud chcete nechat protection zapnutý:

1. V Dashboardu: **Settings** → **Deployment Protection**
2. Zkopírujte **Protection Bypass Token**
3. Použijte ho v frontendu (viz níže)

### Možnost 3: Otevřít přes CLI

```bash
cd backend
vercel open
```

Pak v dashboardu vypněte Deployment Protection.

## Po vypnutí Protection

Po vypnutí Deployment Protection by CORS měl fungovat, protože:
- ✅ Backend už má CORS konfiguraci pro `.vercel.app` URL
- ✅ Preflight OPTIONS požadavky se dostanou k NestJS aplikaci
- ✅ CORS hlavičky se přidají správně

## Testování

Po vypnutí protection zkuste znovu načíst frontend. CORS chyby by měly zmizet.

