# 🚀 Ako spustiť backend manuálne

## Problém
Backend sa nespúšťa automaticky, pretože chýba `dist/shared/index.js` súbor.

## ✅ Riešenie - Postup krok za krokom

### 1. Otvoriť terminál a prejsť do backend priečinka
```bash
cd "/Users/jaroslav/Documents/CODING/WEBY miro /backend"
```

### 2. Vytvoriť shared modul
```bash
mkdir -p dist/shared
node build-shared.js
```

### 3. Overiť, že súbor existuje
```bash
ls -la dist/shared/index.js
```
Malo by zobraziť súbor.

### 4. Spustiť backend
```bash
node dist/main.js
```

Malo by sa zobraziť:
```
🚀 Backend server running on http://localhost:3000
```

### 5. Nechať terminál otvorený
**Dôležité:** Nezavrieť terminál, kde beží backend! Ak ho zatvoríte, backend sa zastaví.

### 6. Obnoviť stránku v prehliadači
- Otvoriť `http://localhost:3001/admin/analytics`
- Stlačiť **F5** alebo **Cmd+R**

## ✅ Overenie, že funguje

V novom termináli:
```bash
# Health check
curl http://localhost:3000/api/health

# Analytics endpoint
curl http://localhost:3000/api/analytics/all?days=30
```

Oba príkazy by mali vrátiť JSON (nie 404 alebo connection refused).

## 🔄 Ak potrebuješ reštartovať

1. V termináli, kde beží backend, stlačiť **Ctrl+C**
2. Zopakovať kroky 2-4 vyššie

## 💡 Tip
Pre jednoduchšie spustenie môžeš vytvoriť skript:
```bash
# V backend/ priečinku vytvoriť start.sh:
#!/bin/bash
mkdir -p dist/shared
node build-shared.js
node dist/main.js
```

Potom stačí spustiť: `./start.sh`

