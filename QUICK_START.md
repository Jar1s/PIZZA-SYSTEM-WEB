# 🚀 Quick Start Guide

## Prvýkrát spustenie

```bash
# 1. Spustiť setup (nainštaluje Node, dependencies, vytvorí .env súbory)
chmod +x setup.sh start.sh restart.sh stop.sh status.sh
./setup.sh

# 2. Spustiť projekt
./start.sh
```

## Každodenné spustenie

```bash
# Jednoducho spustiť
./start.sh
```

Skript automaticky:
- ✅ Prepne na správnu Node verziu (20.19.5)
- ✅ Spustí backend na http://localhost:3000
- ✅ Spustí frontend na http://localhost:3001
- ✅ Počká, kým backend beží
- ✅ Vyčistí Next.js cache

## AI príkazy (pre automatizáciu)

Keď povieš AI "restart", "start", "stop", "status", AI automaticky zavolá:

```bash
./restart.sh  # Reštartuje servery
./start.sh    # Spustí servery
./stop.sh     # Zastaví servery
./status.sh   # Zobrazí stav serverov
```

## Manuálne príkazy

```bash
# Reštart
./restart.sh

# Zastaviť
./stop.sh

# Status
./status.sh

# Spustiť
./start.sh
```

## Manuálne spustenie (ak skript nefunguje)

```bash
# Terminal 1 - Backend
cd backend
eval "$(/opt/homebrew/opt/fnm/bin/fnm env)" && fnm use 20
npm run start:dev

# Terminal 2 - Frontend  
cd frontend
eval "$(/opt/homebrew/opt/fnm/bin/fnm env)" && fnm use 20
rm -rf .next
npm run dev
```

## Ak niečo nefunguje

```bash
# Kompletný reset
./setup.sh  # Znovu nainštaluje všetko

# Alebo manuálne:
cd backend && rm -rf node_modules dist && npm install
cd ../frontend && rm -rf node_modules .next && npm install
```

## Porty

- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:3000
- **Health check**: http://localhost:3000/api/health

## Poznámky

- Skript automaticky detekuje, či servery už bežia
- Logy sú v `backend.log` a `frontend.log`
- Stlačením `Ctrl+C` sa servery zastavia (len pri `./start.sh`)
- Pri `./restart.sh` servery bežia na pozadí
