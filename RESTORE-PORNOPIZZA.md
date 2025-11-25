# Obnovenie PornoPizza Brandu

Ak sa PornoPizza brand odstránil alebo zmizol z databázy, môžeš ho obnoviť pomocou SQL skriptu.

## Ako obnoviť PornoPizza brand

### Metóda 1: Supabase SQL Editor (najjednoduchšie)

1. Otvor Supabase Dashboard
2. Choď do **SQL Editor**
3. Skopíruj obsah súboru `restore-pornopizza.sql`
4. Vlož do SQL Editora
5. Klikni na **Run** alebo stlač `Ctrl+Enter`
6. Skontroluj výstup - mal by sa zobraziť záznam s PornoPizza brandom

### Metóda 2: Prisma Seed (ak máš prístup k backendu)

```bash
cd backend
npm run prisma:seed
```

Toto spustí seed skript, ktorý vytvorí/aktualizuje PornoPizza brand.

## Čo skript robí

- **Vytvorí** PornoPizza tenant, ak neexistuje
- **Aktualizuje** existujúci tenant, ak už existuje
- **Zachová** `isActive` status, ak bol tenant vypnutý (neprepíše ho na `true`)
- **Nastaví** správne farby, logo, layout a konfiguráciu

## Overenie

Po spustení skriptu by si mal vidieť v Brands Management:
- **PornoPizza** brand v zozname
- Status: **Active** alebo **Inactive** (podľa toho, aký bol predtým)

## Poznámka

Skript používa `ON CONFLICT DO UPDATE`, takže je bezpečné ho spustiť viackrát - buď vytvorí nový brand, alebo aktualizuje existujúci.


