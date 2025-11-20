# 🚀 Vercel Deploy Guide

## Krok 1: Přihlášení do Vercelu

```bash
cd frontend
vercel login
```

Toto otevře prohlížeč, kde se přihlásíte do Vercelu (nebo vytvoříte účet).

## Krok 2: Deploy projektu

```bash
vercel
```

Vercel se vás zeptá na několik otázek:
- **Set up and deploy?** → Ano (Y)
- **Which scope?** → Vyberte svůj účet
- **Link to existing project?** → Ne (N) - vytvoříme nový
- **What's your project's name?** → pizza-ecosystem-frontend (nebo jak chcete)
- **In which directory is your code located?** → ./ (aktuální složka)
- **Want to override the settings?** → Ne (N)

## Krok 3: Nastavení Environment Variables

Po prvním deployu musíte nastavit environment variables:

### Přes Vercel Dashboard:
1. Jděte na https://vercel.com/dashboard
2. Vyberte projekt `pizza-ecosystem-frontend`
3. Settings → Environment Variables
4. Přidejte:

```
NEXT_PUBLIC_API_URL=https://pizza-ecosystem-api.fly.dev
```

**Poznámka:** Pokud ještě nemáte backend na Fly.io, použijte:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```
(pro testování)

### Nebo přes CLI:
```bash
vercel env add NEXT_PUBLIC_API_URL
# Zadejte hodnotu: https://pizza-ecosystem-api.fly.dev
```

## Krok 4: Production Deploy

```bash
vercel --prod
```

Toto nasadí projekt na produkční URL (např. `pizza-ecosystem-frontend.vercel.app`)

## Krok 5: Připojení vlastních domén

1. Vercel Dashboard → Project → Settings → Domains
2. Přidejte domény:
   - `pornopizza.sk`
   - `pizzavnudzi.sk`
   - `maydaypizza.sk`

3. V DNS nastavení domén přidejte:
   - **Type:** CNAME
   - **Name:** @ (nebo www)
   - **Value:** cname.vercel-dns.com

## Automatické Deployy

Pokud máte projekt na GitHubu:
1. Vercel Dashboard → Project → Settings → Git
2. Připojte GitHub repository
3. Každý push do `main` branch automaticky deployne projekt

## Kontrola Deployu

```bash
# Zobrazit všechny deployy
vercel ls

# Zobrazit logy
vercel logs

# Otevřít projekt v prohlížeči
vercel open
```

## Troubleshooting

### Build Error
```bash
# Zkontrolujte build lokálně
npm run build

# Pokud funguje lokálně, zkuste:
vercel --debug
```

### Environment Variables nefungují
- Ujistěte se, že proměnné začínají s `NEXT_PUBLIC_` (pro frontend)
- Po přidání proměnných musíte redeployovat:
  ```bash
  vercel --prod
  ```

### Multi-tenant routing nefunguje
- Zkontrolujte `middleware.ts` - musí správně detekovat domény
- Ujistěte se, že všechny domény jsou přidané v Vercel Dashboard

## Náklady

- **Hobby Plan (Zdarma):** 100 GB bandwidth/mes
- **Pro Plan ($20/mes):** Neomezený bandwidth

Pro začátek je Hobby plan dostačující!

