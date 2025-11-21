# 🔧 Supabase Connection Troubleshooting

## Problém: "Can't reach database server"

### Možné příčiny:

1. **Projekt se stále vytváří**
   - V Supabase Dashboard zkontrolujte status
   - Pokud vidíte "Setting up..." nebo "Provisioning", počkejte 2-5 minut
   - Status musí být "Active" (zelený)

2. **Špatný connection string formát**
   - Použijte přesný string z Dashboard → Settings → Database → Connection string → URI
   - Klikněte na ikonu kopírování, nepište ho ručně

3. **Firewall/IP whitelisting**
   - Supabase může mít IP restrictions
   - Zkontrolujte v Settings → Database → Network restrictions

4. **Heslo obsahuje speciální znaky**
   - Pokud heslo obsahuje `@`, `#`, `%`, atd., musí být URL-encoded
   - Např. `@` → `%40`, `#` → `%23`

---

## Řešení:

### Krok 1: Zkontrolujte status projektu
1. Jděte na: https://supabase.com/dashboard/project/wfzppetogdcgcgjvmrgt
2. Zkontrolujte, jestli je projekt **Active**

### Krok 2: Zkopírujte přesný connection string
1. Settings → Database
2. Connection string → **URI**
3. Klikněte na **ikonu kopírování** (ne pište ručně!)
4. Použijte přesně ten string

### Krok 3: Zkuste Prisma Studio (test připojení)
```bash
cd backend
export DATABASE_URL="postgresql://postgres:011jarko@db.wfzppetogdcgcgjvmrgt.supabase.co:5432/postgres"
npx prisma studio
```

Pokud Prisma Studio otevře, připojení funguje!

### Krok 4: Pokud stále nefunguje
- Zkuste reset hesla: Settings → Database → Reset database password
- Zkuste použít Session mode connection string (místo URI)
- Kontaktujte Supabase support

---

## Alternativa: Použijte Supabase CLI

```bash
# Instalace
npm install -g supabase

# Login
supabase login

# Link projektu
supabase link --project-ref wfzppetogdcgcgjvmrgt

# Spusťte migrace
npx prisma migrate deploy
```

