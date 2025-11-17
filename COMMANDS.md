# 🤖 AI Commands Reference

Keď povieš AI tieto príkazy, automaticky sa vykonajú:

## Základné príkazy

- **"restart"** alebo **"reštart"** → `./restart.sh`
  - Zastaví a znovu spustí oba servery
  
- **"start"** alebo **"spusti"** → `./start.sh`
  - Spustí servery (ak už bežia, zobrazí varovanie)
  
- **"stop"** alebo **"zastav"** → `./stop.sh`
  - Zastaví oba servery
  
- **"status"** alebo **"stav"** → `./status.sh`
  - Zobrazí stav serverov, Node verziu, .env súbory

## Príklady

```
"restart backend a frontend"
"reštartuj servery"
"spusti projekt"
"zastav všetko"
"aký je stav?"
```

## Technické detaily

Všetky skripty:
- Automaticky prepnú Node verziu na 20.19.5 (z `.nvmrc`)
- Detekujú, či servery už bežia
- Logujú do `backend.log` a `frontend.log`
- Spúšťajú servery na pozadí (okrem `start.sh` v interaktívnom móde)
