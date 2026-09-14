---
name: pizza-migrate
description: Bezpečná Prisma migrácia pre pizza ecosystem (PIZZA-SYSTEM-WEB). Použi pri každej zmene schémy, pred mergom vetvy so schema change, alebo keď Render deploy padá na migrate deploy.
---

# Pizza — bezpečná DB migrácia

Canonical tree: `~/OS/ACTUAL/PIZZA-SYSTEM-WEB`. Over cez skill `canonical-tree`, kým čokoľvek spustíš.

## Pravidlá pred migráciou

- Popíš zmenu: tabuľka / stĺpec / index / constraint.
- Urči typ: **aditívna**, **deštruktívna**, alebo **data-migrating**.
- Over, či sa dá spustiť viackrát bezpečne (idempotencia).
- Aditívne zmeny prvé. Nikdy nepremenúvaj/nemaž pole v tom istom kroku ako zmenu správania.
- Jedna migrácia = jeden problém.

## Pripojenie

Na migrácie použi **direct connection**, nie pooler.

> ⚠️ Supabase session pooler má limit **15 klientov na DB spolu** — backend, admin skripty aj migrácie.
> Backend si drží `connection_limit=6` (`PRISMA_CONNECTION_LIMIT`).
> Symptóm vyčerpania: `EMAXCONNSESSION max clients reached`, HTTP 500 na zápisoch (napr. vytvorenie objednávky), čítania stále prechádzajú.
> Nikdy nepúšťaj viac než 1–2 ad-hoc skripty proti produkcii naraz a hneď ich odpoj.

## Baseline

História bola squashnutá do `20260813000000_baseline` (2026-08-13). Stará história je v `backend/prisma/migrations-archive/`, Prisma ju ignoruje.
Nové migrácie: `npx prisma migrate dev --name <nazov>` — radia sa ZA baseline.

## Postup na produkcii — PRED mergom/deployom

```bash
cd ~/OS/ACTUAL/PIZZA-SYSTEM-WEB/backend
```

**1. Drift check (len čítanie):**
```bash
DATABASE_URL="<PROD_URL>" npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma --script
```
Očakávané: `-- This is an empty migration.`
Ak nie je prázdny — výstup JE presne to SQL, ktoré na produkcii chýba. Ukáž ho Jaroslavovi, aplikuj v Supabase SQL editore, zopakuj krok 1.

**2. Označ baseline ako aplikovanú** (len zápis riadku do `_prisma_migrations`, pre bežiacu produkciu neškodné):
```bash
DATABASE_URL="<PROD_URL>" npx prisma migrate resolve --applied 20260813000000_baseline
```

**3. Over stav:**
```bash
DATABASE_URL="<PROD_URL>" npx prisma migrate status
```
Staré migrácie hlásené ako „not found locally" sú v poriadku.

**4.** Až teraz merge + deploy. Render build spustí `migrate deploy`, ktorý už nemá čo aplikovať.

## Po migrácii

- Backend nabootuje a zbuilduje sa.
- Admin nastavenia / mappingy sú naplnené.
- Prejde príslušný smoke test (skill `pizza-deploy`).

## Rollback

- Ak migrácia nie je reverzibilná, zapíš fallback do PR.
- Ak treba manuálne SQL, zapíš presný príkaz do PR.

## Pred zásahom na produkcii vždy ukáž, čo sa zmení, a počkaj na potvrdenie.
