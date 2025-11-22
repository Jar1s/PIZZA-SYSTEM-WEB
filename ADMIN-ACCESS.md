# 🔐 Ako sa Dostať do Admin Rozhrania

## 📍 URL

### Lokálne (Development):
```
http://localhost:3001/admin
```

### Na Vercel (Production):
```
https://your-project.vercel.app/admin
```

## 🔑 Login

### Krok 1: Choď na Login Stránku

Ak nie si prihlásený, admin rozhranie ťa automaticky presmeruje na:
```
http://localhost:3001/login
```
alebo
```
https://your-project.vercel.app/login
```

### Krok 2: Prihlás sa

**Development (Lokálne):**
- V development móde sa môže automaticky prihlásiť s `admin` / `admin123`
- Alebo použij credentials z databázy

**Production (Vercel):**
- Musíš mať admin účet v databáze
- Použij username a password, ktoré máš nastavené

## 👤 Admin Credentials

### Ako Vytvoriť Admin Účet

Admin účet musí existovať v databáze. Môžeš ho vytvoriť:

#### Možnosť 1: Cez Backend API (ak máš endpoint)
```bash
POST /api/auth/register
{
  "username": "admin",
  "password": "tvoje-heslo",
  "name": "Admin User",
  "role": "ADMIN"
}
```

#### Možnosť 2: Cez Prisma Seed Script
Skontroluj, či existuje seed script v `backend/prisma/seed.ts`

#### Možnosť 3: Manuálne v Databáze
Pripoj sa k Supabase databáze a vytvor admin účet v `users` tabuľke.

## 🔍 Skontroluj Existujúce Admin Účty

### Cez Backend API:
```bash
# Získaj všetkých používateľov (ak máš admin endpoint)
GET /api/admin/users
```

### Cez Supabase Dashboard:
1. Choď na [Supabase Dashboard](https://supabase.com/dashboard)
2. Vyber tvoj projekt
3. Choď na **Table Editor** → **users**
4. Skontroluj, či existuje používateľ s `role = 'ADMIN'`

## 🚀 Rýchly Prístup

### Development (Lokálne):
1. Spusti frontend: `cd frontend && npm run dev`
2. Choď na: `http://localhost:3001/admin`
3. Ak nie si prihlásený, presmeruje ťa na `/login`
4. V development móde sa môže automaticky prihlásiť

### Production (Vercel):
1. Choď na: `https://your-project.vercel.app/admin`
2. Ak nie si prihlásený, presmeruje ťa na `/login`
3. Prihlás sa s admin credentials z databázy

## 📝 Poznámka

- Admin rozhranie vyžaduje prihlásenie
- Ak nie si prihlásený, automaticky ťa presmeruje na `/login`
- Po úspešnom prihlásení ťa presmeruje na `/admin`

## 🆘 Ak Nemáš Admin Účet

1. **Skontroluj databázu** - či existuje admin účet
2. **Vytvor admin účet** - cez API alebo manuálne v databáze
3. **Skontroluj backend** - či beží a je dostupný

