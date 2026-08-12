# Migration baseline runbook (2026-08-13)

Migračná história bola squashnutá do jedinej baseline migrácie
`20260813000000_baseline`, pretože stará história sa nedala prehrať na čistú
databázu (migrácie z 2025-01 sa radili pred `init` z 2025-11, `global_settings`
sa vytvárala 3× a v schéme bol drift — `sms_verification_codes`,
`UserRole.CUSTOMER`, `Tenant.currency`, `Product.tenantOverrides`,
`User.phoneVerified` nemali žiadnu migráciu).

Stará história je zachovaná v `backend/prisma/migrations-archive/` (a v git
histórii); Prisma ju ignoruje. Po úspešnom nasadení ju možno zmazať.

## Čo je už overené

- `prisma migrate deploy` s baseline prejde na čistej Postgres 15 DB.
- `prisma migrate diff` medzi výslednou DB a `schema.prisma` je prázdny
  (nulový drift).

## KROKY NA PRODUKCII — spustiť PRED mergom/deployom tejto vetvy

> Kým sa tieto kroky nespravia, každý Render deploy tejto vetvy zlyhá:
> `migrate deploy` by sa pokúsil aplikovať baseline na existujúcu DB
> (CREATE TABLE na existujúce tabuľky). Krok 2 je pre bežiacu produkciu
> neškodný — len zapíše záznam do `_prisma_migrations`.

Použi produkčný `DATABASE_URL` (Supabase, direct connection — nie pooler).

1. **Skontroluj drift produkcie voči schéme** (len čítanie):

   ```bash
   cd backend
   DATABASE_URL="<PROD_URL>" npx prisma migrate diff \
     --from-url "$DATABASE_URL" \
     --to-schema-datamodel prisma/schema.prisma --script
   ```

   Očakávaný výstup: `-- This is an empty migration.`
   Ak nie je prázdny, výstup je presne SQL, ktoré na produkcii chýba —
   pozri si ho a aplikuj manuálne v Supabase SQL editore, potom zopakuj.

2. **Označ baseline ako aplikovanú** (zápis jedného riadku do
   `_prisma_migrations`):

   ```bash
   DATABASE_URL="<PROD_URL>" npx prisma migrate resolve \
     --applied 20260813000000_baseline
   ```

3. **Over stav**:

   ```bash
   DATABASE_URL="<PROD_URL>" npx prisma migrate status
   ```

   Očakávané: baseline je aplikovaná; staré migrácie môžu byť hlásené ako
   „not found locally" — to je v poriadku, `migrate deploy` ich ignoruje.

4. Zmerguj vetvu a nasaď. Render build spustí `prisma migrate deploy`,
   ktorý už nemá čo aplikovať a prejde.

## Dôkaz obnoviteľnosti záloh (spraviť raz po nasadení)

Obnov nočnú zálohu do scratch DB a over, že `migrate deploy` na nej prejde:

```bash
# obnova zálohy (podľa docs/db-backup.md) do scratch DB, potom:
DATABASE_URL="<SCRATCH_URL>" npx prisma migrate resolve --applied 20260813000000_baseline
DATABASE_URL="<SCRATCH_URL>" npx prisma migrate status
```

Nové migrácie sa odteraz vytvárajú štandardne cez
`npx prisma migrate dev --name <nazov>` a radia sa ZA baseline.
