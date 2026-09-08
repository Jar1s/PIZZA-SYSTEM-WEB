# Playbook: spustenie nového brandu

Overený postup z vlny 1 (5 brandov, 2026-09-02) a vlny 2 (6 brandov, 2026-09-08).
Od zadania po live web vrátane identity to je ~1 deň práce, z toho väčšina automatizovaná.

## Vstupy (rozhoduje majiteľ)

- **Názov + doména** (`.sk`, kupuje sa na Websupporte) + **vibe brandu** (jedna veta)
- Farba (primary), emoji, svetlý/tmavý web — ak nie sú dané, navrhnú sa podľa vibe

## 1. Tenant v DB (admin API)

`POST /api/tenants/pornopizza/clone` s `{name, slug, subdomain: slug, domain, theme: {...}, deliveryConfig: {woltConfig: null}}`.

- Klon preberá: katalóg 40 produktov, kuchyňu (Tobrucká 82/5), otváracie hodiny, cenové pásma, produkčný GoPay, Storyous, analytics.
- **Vždy vynulovať `woltConfig`** (inak sa skopírujú PornoPizza kľúče) a hneď `PATCH {isActive:false}` — aktivuje sa až pri launchi.
- Theme pri klone: `primaryColor`, `secondaryColor`, `logo: /logos/<slug>.png`, `favicon: /favicons/<slug>.png`, `seoTitle` (≤60 znakov, vzor `Brand — slogan | Rozvoz Bratislava`), `description` (≤155 znakov), `layout: {headerStyle, backgroundStyle, heroVariant, cardStyle, useCustomLogo:false, useCustomBackground:false}`.
- `heroVariant`: classic | split | minimal; `cardStyle`: rounded | sharp | framed — rozdeľovať tak, aby po sebe idúce brandy neboli rovnaké.

## 2. Texty brandu (admin API)

- **Hero copy** (theme, top-level): `heroHeadlineSk/En` (segment v `**hviezdičkách**` sa vyfarbí akcentom), `heroTaglineSk/En`.
- **Sekcie menu** (theme.subCategoryLabels): 8 kľúčov `foreplay, mainAction, premiumSins, deluxeFetish, stangle, soups, desserts, drinks` — každý `{emoji, titleSk, titleEn, descSk:"", descEn:"", showDescription:false}` v hlase brandu.
- **Názvy produktov**: `PATCH /api/<slug>/products/<id> {displayName}` — 24 pizz + polievka + dezert + 4 štangle v hlase brandu; nápoje sa nechávajú štandardné. Interné `name` sa NIKDY nemení (Storyous mapping).
- POZOR: `updateTenant` merguje theme len plytko — `layout` a `subCategoryLabels` posielať vždy CELÉ.

## 3. Identita — logo, favicony, fotky

- **Logo**: emoji-wordmark (Arial Rounded MT Bold, farba brandu, jedno písmeno nahradené emoji, 2 riadky, 834×424 transparent PNG) — renderuje sa Playwright chromiom. Favicon: emoji 512 PNG → 180/192/ico (magick).
- **40 fotiek**: Higgsfield `gpt_image_2` image-to-image z referenčných fotiek (originály v `frontend/public/images/...` podľa `FULL_BRAND_SET` v `frontend/lib/brand-image-overrides.ts`). Prompt: „Keep the dish/bottle EXACTLY... change ONLY the background and surface to: <SCÉNA BRANDU>". Jedlá 3:2 medium (1 kredit), nápoje high kvôli etiketám (3,5), hero 16:9 2k high text-to-image (6,5). ≈ 68 kreditov / brand.
- Výstup: `frontend/public/images/brands/<slug>/{hero,pizzas/{classic,premium},drinks,stangle,soups,desserts}` — originál (jpg q86 / png) + webp (cwebp q82). Layout MUSÍ sedieť s partypizza vzorom; test `brand-image-overrides.test.ts` kontroluje existenciu každého súboru.

## 4. Kód (jeden PR)

- `frontend/lib/tenant-utils.ts` — hostname riadok + test v `tenant-utils.test.ts`
- `frontend/lib/brand-image-overrides.ts` — `<slug>: FULL_BRAND_SET`
- `frontend/lib/brand-hero.ts` — emoji flavor (badge/CTA/staty)
- `frontend/components/admin/OrderList.tsx` — `BRAND_META` záznam (label, iniciály, tailwind gradient)
- Do PR patria aj logá, favicony a fotky. CI test na disku súbory vyžaduje — PR bez assetov nezbehne.

## 5. Vercel (CLI — prihlásené ako jar1s)

- `vercel project add <slug>` → PATCH cez API: framework nextjs, rootDirectory `frontend`, node 20.x
- Env ×3 prostredia: `NEXT_PUBLIC_API_URL=https://api.p0rnopizza.sk`, `NEXT_PUBLIC_TENANT_SLUG=<slug>`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (env pull z partypizza)
- `vercel git connect` (klon repa v scratchpade). Merge PR = auto-deploy.
- Po kúpe domény: `vercel domains add <slug>.sk <slug>` + `www.` + 308 redirect www→apex (apex je primárna, DB má apex v `domain`).
- Preview pred doménou: `<slug>.vercel.app` (globálny namespace — meno môže byť obsadené, Vercel pridá príponu). Tenant musí byť aktívny.

## 6. Websupport + Google (Chrome session — klikacia časť)

Pre každú doménu:
1. **DNS**: zmazať parking `A` aj **`AAAA`** na `@` aj `www`; pridať `A @ → 76.76.21.21`, `CNAME www → cname.vercel-dns.com`; MX/TXT/NS nechať
2. **Mailhosting** (Basic): schránka `info@<doména>`, heslo do `~/.config/pizza/mail-hesla.txt` (`slug=heslo`, mód 600), **vypnúť GEO ochranu** (inak 535 z Rendera)
3. **Google OAuth**: nový GCP projekt s menom brandu → consent External (authorized domain, Homepage `https://<doména>`, Privacy `/privacy`, Terms `/terms`) → **Publish** → Web client s redirect `https://<doména>/auth/google/callback` → creds do `~/.config/pizza/google-oauth.txt` (`slug=ID:SECRET`)
4. **Search Console**: Domain property → DNS TXT verifikácia → submit `https://<doména>/sitemap.xml` → Request indexing (sitemap status „Couldn't fetch" po submite je kozmetika)

## 7. Prepojenie + launch (admin API)

- `emailConfig`: `{fromEmail: info@<doména>, smtpHost: smtp.m1.websupport.sk, smtpPort: 465, smtpSecure: true, smtpUser: info@<doména>, smtpPassword}` — test: SMTP odoslanie + registrácia (`+alias` gmail) = brandovaný welcome mail
- `theme.googleOAuthConfig`: `{enabled: true, clientId, clientSecret}` — test: `GET /api/auth/customer/google?tenant=<slug>` musí redirectovať s novým client_id
- `PATCH {isActive: true}` po prepnutí DNS
- Watchdog: pridať doménu do `.github/workflows/health-watchdog.yml`

## 8. Biznis kroky (majiteľ)

- **GoPay**: pridať doménu k účtu (integracie@gopay.sk) + testovacia objednávka kartou
- **Wolt**: onboarding brandu (merchant + venue + API key) → vložiť v Admin → Brands → otestovať zóny; dovtedy beží pickup/vlastný rozvoz
- Prvé maily z novej domény padajú do spamu — klikať „Nie je spam", zabehne sa

## Známe pasce

- zsh polia sú 1-indexované — na párovanie súborov s API používať python
- Verejné API sanitizuje `deliveryConfig`/`emailConfig` — pravdu o konfigurácii ukazuje len admin readiness (`/api/settings/tenants/<slug>/readiness`)
- Websupport SMTP loguje 535 aj pri správnom hesle, ak je zapnutá GEO ochrana
- `outputFileTracingIncludes` s `public/**` už NIKDY nevracať — 250MB limit funkcií
- Render buildy: build nástroje sú v `dependencies` (nie dev) — nechať tak
