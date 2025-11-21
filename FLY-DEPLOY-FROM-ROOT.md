# 🚀 Fly.io Deploy - Dôležité!

## ⚠️ Dôležité: Deploy musí byť spustený z ROOT adresára!

Fly.io build context musí byť root adresár projektu, aby Dockerfile mohol kopírovať `shared` modul.

### Správny spôsob deployu:

```bash
export FLYCTL_INSTALL="/Users/jaroslav/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

# MUSÍŠ BYŤ V ROOT ADRESÁRI!
cd "/Users/jaroslav/Documents/CODING/WEBY miro"

# Deploy z root adresára
flyctl deploy -a pizza-ecosystem-api -c backend/fly.toml
```

### Alebo použij deploy skript:

```bash
./deploy-fly.sh
```

(Skript automaticky prejde do správneho adresára)

---

## Problém:

Ak spustíš `flyctl deploy` z `backend/` adresára, build context bude `backend/` a Dockerfile nebude môcť kopírovať `shared` modul z parent adresára.

---

## Riešenie:

Vždy spúšťaj deploy z **root adresára projektu** s `-c backend/fly.toml`!

