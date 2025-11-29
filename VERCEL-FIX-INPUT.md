# 🔧 Oprava Vercel Deployment Input

## ❌ Problém

V input fielde je:
```
https://github.com/Jar1s/PIZZA-SYSTEM-WEB/tree/main
```

Toto nie je platný commit reference - Vercel očakáva len branch name alebo commit hash.

## ✅ Riešenie

### Krok 1: Vymaž URL
Vymaž celý obsah input fieldu (vrátane `https://github.com/...`)

### Krok 2: Zadaj Branch Name
Zadaj len:
```
main
```

### Krok 3: Vytvor Deployment
Klikni **"Create Deployment"** - tlačidlo by malo byť teraz aktívne.

## 🎯 Alternatíva: Použi Commit Hash

Ak chceš deploynúť konkrétny commit, zadaj:
```
50a8550
```

## 📝 Poznámka

**NEPOUŽÍVAJ:**
- ❌ `https://github.com/Jar1s/PIZZA-SYSTEM-WEB/tree/main`
- ❌ `https://github.com/Jar1s/PIZZA-SYSTEM-WEB`
- ❌ `github.com/Jar1s/PIZZA-SYSTEM-WEB`

**POUŽI:**
- ✅ `main` (najjednoduchšie)
- ✅ `50a8550` (commit hash)
- ✅ `HEAD` (najnovší commit)





