# 🔧 Oprava: Chýbajúci stĺpec `passwordResetToken`

## Problém

Chyba: `The column users.passwordResetToken does not exist in the current database`

Tento stĺpec je potrebný pre funkciu resetovania hesla a nastavenia hesla po guest checkout.

## Riešenie

### Krok 1: Spusti SQL migráciu v Supabase

1. **Otvori Supabase Dashboard**: https://supabase.com/dashboard
2. **Vyber svoj projekt**
3. **Prejdi na SQL Editor** (v ľavom menu)
4. **Skopíruj obsah** súboru `fix-password-reset-token.sql`
5. **Vlož do SQL Editora** a klikni na **Run**

### Krok 2: Overenie

Po spustení SQL by si mal vidieť výsledok, ktorý zobrazuje:
- `passwordResetToken` (TEXT, nullable)
- `passwordResetExpires` (TIMESTAMP, nullable)

### Krok 3: Redeploy backend

Po pridaní stĺpcov:
1. Backend by mal automaticky detekovať zmeny
2. Alebo môžeš manuálne redeploynúť na Render.com

## Čo sa pridá:

- `passwordResetToken` - TEXT stĺpec pre token na reset hesla
- `passwordResetExpires` - TIMESTAMP stĺpec pre expiráciu tokenu
- Unique index na `passwordResetToken`
- Index pre rýchle vyhľadávanie

## Alternatíva: Spusti všetky migrácie naraz

Ak chceš pridať všetky chýbajúce stĺpce naraz, môžeš spustiť:
1. `fix-users-phone.sql` (ak ešte nebol spustený)
2. `fix-password-reset-token.sql`

---

**Poznámka**: Tento problém vznikol, pretože Prisma schéma obsahuje `passwordResetToken`, ale databázová migrácia nebola spustená v Supabase.

