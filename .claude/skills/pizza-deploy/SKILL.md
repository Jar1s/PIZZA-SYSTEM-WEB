---
name: pizza-deploy
description: Deploy checklist a smoke testy pre pizza ecosystem (PIZZA-SYSTEM-WEB) — Vercel frontend + Render backend + Supabase. Použi pred mergom, pred shipnutím, a po každom deployi ktorý sa dotkol settings, objednávok, Storyous, Wolt alebo delivery logiky.
---

# Pizza — deploy a smoke testy

Canonical tree: `~/OS/ACTUAL/PIZZA-SYSTEM-WEB`. Over cez skill `canonical-tree`.

## Poradie releasu — dodrž

1. **Databáza** (ak treba) → skill `pizza-migrate`
2. **Backend** (Render)
3. **Frontend** (Vercel)

Pri zmene API kontraktu redeploy backend **pred** frontendom.

## Pred mergom

**Frontend**
- PR má Vercel preview URL.
- CI build prešiel.
- Storefront načíta obrázky, logo, hero.
- Admin dashboard bez runtime chýb.

**Backend**
- PR má Render staging alebo bezpečnú preview cestu, ak sa dotýka integrácií či migrácií.
- CI build a testy prešli.
- Migrácie aplikované **pred** deployom.

**DB**
- Migrácia je idempotentná / bezpečná na opakované spustenie.
- Manuálne SQL kroky zapísané v PR.
- Poznámka, či treba po deployi upraviť admin settings alebo mappingy.

## Smoke testy — po deployi

**Verejný web:** homepage · logo · hero · obrázky produktov · košík sa otvorí

**Admin:** `/admin` načíta · `OrderList` renderuje · výber objednávky · prechody stavov · spodný action bar viditeľný a použiteľný

**Settings:** `/admin/settings` načíta · Storyous settings · Storyous preview · delivery fee tiers · mapping dát vybraného tenanta

**Storyous:** manuálny sync sa spustí · auto sync beží pri očakávanom stave objednávky · preview sedí s výstupom backendu

**Wolt:** create flow pre in-zone doručenie · cancel flow existujúceho doručenia · out-of-zone stále blokuje alebo varuje

**Delivery:** blízka adresa → platný fee tier · hraničná adresa → očakávaný výsledok · chýbajúce súradnice → konzistentný fallback

## Release nie je hotový, kým neprejdú kritické flow.
