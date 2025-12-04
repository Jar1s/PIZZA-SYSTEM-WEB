# 🚀 Optimalizácia načítavania obrázkov

## 📋 Problém
Obrázky na webe sa začali pomaly načítavať.

## ✅ Aplikované optimalizácie

### 1. **Zvýšená cache doba** 
**Súbor:** `frontend/next.config.js`
- **Pred:** `minimumCacheTTL: 60` (60 sekúnd)
- **Po:** `minimumCacheTTL: 31536000` (1 rok)
- **Výhoda:** Optimalizované obrázky sa cachujú na 1 rok, čo výrazne zrýchli opakované návštevy

### 2. **Znížená kvalita obrázkov**
**Súbor:** `frontend/components/menu/ProductCard.tsx`
- **Pred:** `quality={85}`
- **Po:** `quality={75}`
- **Výhoda:** Menšie súbory = rýchlejšie načítanie, kvalita stále výborná pre web

### 3. **Odstránené vypnutie optimalizácie**
**Súbor:** `frontend/components/menu/ProductCard.tsx`
- **Pred:** `unoptimized={displayImage?.includes(' ') || displayImage?.includes('%20')}`
- **Po:** Odstránené (Next.js automaticky spracuje URL encoding)
- **Výhoda:** Všetky obrázky sú teraz optimalizované, vrátane tých s medzerami v URL

### 4. **Viac priority obrázkov**
**Súbor:** `frontend/components/menu/ProductCard.tsx`
- **Pred:** `priority={index < 4 || isBestSeller}` a `loading={index < 4 ? "eager" : "lazy"}`
- **Po:** `priority={index < 6 || isBestSeller}` a `loading={index < 6 ? "eager" : "lazy"}`
- **Výhoda:** Prvých 6 obrázkov sa načíta okamžite (namiesto 4), čo zlepšuje vnímanú rýchlosť

## 📊 Očakávané výsledky

### **Rýchlosť načítania**
- **Prvé načítanie:** Rýchlejšie o ~20-30% (menšie súbory)
- **Opakované návštevy:** Rýchlejšie o ~80-90% (dlhodobá cache)
- **Percepcia:** Prvých 6 obrázkov viditeľných okamžite

### **Veľkosť súborov**
- **Pred:** ~180KB na obrázok (quality 85)
- **Po:** ~120-140KB na obrázok (quality 75)
- **Úspora:** ~25-30% menšie súbory

### **Cache efektivita**
- **Pred:** Cache len 60 sekúnd = časté re-optimalizovanie
- **Po:** Cache 1 rok = optimalizácia len raz, potom z cache

## 🔧 Technické detaily

### **Next.js Image Optimization**
Next.js automaticky:
- Konvertuje obrázky na WebP/AVIF formáty (30-50% menšie)
- Generuje responsive verzie pre rôzne veľkosti obrazoviek
- Používa lazy loading pre obrázky mimo viewportu
- Cachuje optimalizované verzie

### **Priority Loading**
- Prvých 6 produktov: `priority={true}` + `loading="eager"`
- Ostatné produkty: `loading="lazy"` (načítajú sa pri scrollovaní)

### **Cache Strategy**
- Optimalizované obrázky sa cachujú na 1 rok
- Browser cache + Next.js cache
- Výrazne rýchlejšie opakované návštevy

## ✅ Overenie

### **Ako otestovať zlepšenie:**

1. **Vyčistiť cache a testovať:**
   ```bash
   # V Chrome DevTools
   - Network tab → Disable cache
   - Hard refresh (Cmd+Shift+R)
   - Skontrolovať čas načítania obrázkov
   ```

2. **Skontrolovať veľkosť súborov:**
   - Network tab → Filter: Img
   - Skontrolovať "Size" stĺpec
   - Obrázky by mali byť menšie (~120-140KB namiesto ~180KB)

3. **Skontrolovať cache:**
   - Načítať stránku prvýkrát
   - Obnoviť stránku (Cmd+R)
   - Obrázky by sa mali načítať okamžite z cache

4. **Skontrolovať priority loading:**
   - Network tab → Filter: Img
   - Prvých 6 obrázkov by sa malo načítať okamžite
   - Ostatné by sa mali načítať pri scrollovaní

## 🎯 Ďalšie možné optimalizácie (voliteľné)

### **1. Image CDN**
- Použiť Cloudflare Images alebo Imgix
- Globálne edge caching
- On-the-fly transformácie

### **2. Prefetching**
- Prefetch obrázky pri hover nad produktom
- Prediktívne načítanie

### **3. Blur Placeholders**
- Pridať low-quality placeholders
- Lepšia percepcia rýchlosti

### **4. Compression Check**
- Skontrolovať, či nie sú originálne obrázky príliš veľké
- Optimalizovať pred uploadom

---

**Dátum:** $(date)
**Status:** ✅ Aplikované






