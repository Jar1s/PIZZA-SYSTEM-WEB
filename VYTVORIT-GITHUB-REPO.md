# 🚀 Vytvorenie GitHub Repozitára - Krok za Krokom

## Krok 1: Vytvorte Repozitár na GitHub

1. **Choďte na:** https://github.com/new

2. **Vyplňte formulár:**
   - **Repository name:** `pizza-platform` (alebo váš názov)
   - **Description:** `Multi-tenant pizza ordering platform`
   - **Vyberte:** ⚪ **Private** (alebo ⚪ Public - podľa vašich preferencií)
   - **⚠️ DÔLEŽITÉ:** ✅ **NECHOĎTE** zaškrtnúť "Add a README file" (máme ho už)
   - **⚠️ DÔLEŽITÉ:** ✅ **NECHOĎTE** zaškrtnúť "Add .gitignore" (máme ho už)
   - **⚠️ DÔLEŽITÉ:** ✅ **NECHOĎTE** zaškrtnúť "Choose a license" (pridáme neskôr ak potrebujete)

3. **Kliknite:** 🟢 **"Create repository"**

## Krok 2: Po Vytvorení Repozitára

Po vytvorení repozitára GitHub vám ukáže URL, napríklad:
```
https://github.com/jaroslav/pizza-platform.git
```

**Skopírujte tento URL** a potom spustite jeden z týchto príkazov:

### Možnosť A: Použitie skriptu (najjednoduchšie)
```bash
cd "/Users/jaroslav/Documents/CODING/WEBY miro "
./push-to-github.sh https://github.com/VASE-USERNAME/VASE-REPO.git
```

### Možnosť B: Manuálne príkazy
```bash
cd "/Users/jaroslav/Documents/CODING/WEBY miro "
git remote add origin https://github.com/VASE-USERNAME/VASE-REPO.git
git branch -M main
git push -u origin main
```

## Krok 3: Overenie

Po úspešnom pushi navštívte:
```
https://github.com/VASE-USERNAME/VASE-REPO
```

Mali by ste vidieť všetky vaše súbory!

---

## ⚡ Rýchly Príkaz (Po Vytvorení Repozitára)

Skopírujte URL z GitHubu a spustite:

```bash
cd "/Users/jaroslav/Documents/CODING/WEBY miro " && git remote add origin PASTE_URL_HERE && git branch -M main && git push -u origin main
```

**Nahraďte `PASTE_URL_HERE` URL vašim repozitárom!**

---

## 📝 Poznámky

- **Prvý push** môže trvať nejaký čas (263 súbory)
- **Ak sa spýta na heslo:** použite GitHub Personal Access Token (nie vaše GitHub heslo)
- **Ak nemáte token:** vytvorte ho na https://github.com/settings/tokens

---

**Po vytvorení repozitára mi pošlite URL a ja vám pomôžem pushnúť!** 🚀

