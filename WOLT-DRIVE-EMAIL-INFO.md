# Wolt Drive - Informácie z Emailu

## 📧 Dôležité informácie z emailu od Bohdany (Wolt Drive)

### 💰 Ceny doručenia

#### FIX cena (do 6km)
- **4.5€ bez DPH** - rovnaká cena bez ohľadu na vzdialenosť (1km = 5km = 4.5€)
- Platí do 6km vzdušnou čiarou od miesta vyzdvihnutia

#### RANGE ceny (podľa vzdialenosti, do 15km)
| Vzdialenosť | Cena EUR bez DPH |
|-------------|------------------|
| 0m - 3000m | 4.25€ |
| 3000m - 6000m | 4.5€ |
| 6000m - 10000m | 7.5€ |
| 10000m - 15000m | 10.5€ |

**Poznámka**: Typ cien (FIX vs RANGE) bude určený v zmluve. API automaticky vráti správnu cenu podľa vzdialenosti pri shipment promise requeste.

### ⏱️ Čas doručenia
- **Priemerný čas**: ~30 minút od objednania
- Podporuje aj **scheduled deliveries** (doručenie na presný čas)

### 📍 Mapa rozvozových zón
- Google Maps: https://www.google.com/maps/d/u/0/edit?mid=13T2nFB_SmMupPjMv34_YqSIXRjuUMCM&ll=48.71893033649823%2C21.249767383868406&z=12

### ✅ Čo je zahrnuté v cene
- Komplexné zabezpečenie expresnej prepravy profesionálnymi kuriérmi
- Dodržiavanie teplotného reťazca a všetkých dôležitých nariadení
- Poistenie prepravy
- Doručovanie 7 dní v týždni - aj počas sviatkov a dní pracovného voľna
- Zákaznícka podpora s priemernou dobou odozvy 29 sekúnd

### ❌ Čo NIE je účtované
- Palivový príplatok
- Príplatok za doručovanie adresátovi súkromnej osobe
- Príplatok za doručenie výhradne do vlastných rúk
- Sezónny príplatok
- Administratívny poplatok za spracovanie faktúr

### 📋 Ďalšie kroky po podpise zmluvy

1. **Technická dokumentácia k Wolt Drive API**
2. **Postman kolekcia** - pre testovanie API
3. **Tech intro a integrations playbook** - v prílohe emailu

### 🔗 Dôležité linky

- **Zmluva**: https://app.juro.com/counterparty/sign/2SWS59e6-m
- **Mapa zón**: https://www.google.com/maps/d/u/0/edit?mid=13T2nFB_SmMupPjMv34_YqSIXRjuUMCM&ll=48.71893033649823%2C21.249767383868406&z=12
- **API dokumentácia**: https://developer.wolt.com/docs/wolt-drive

## 🎯 Vplyv na implementáciu

### 1. Ceny
- API automaticky vráti správnu cenu podľa vzdialenosti
- Nemusíme implementovať vlastnú logiku pre výpočet cien
- Shipment promise response obsahuje `fee.amount` v centoch

### 2. Čas doručenia
- Priemerný čas ~30 minút - toto sa zobrazí v modale
- Môžeme porovnať s `dropoff_eta` z API response

### 3. Validácia vzdialenosti
- FIX: do 6km
- RANGE: do 15km
- Ak je adresa mimo zóny, API vráti error - toto už máme ošetrené

### 4. Scheduled deliveries
- Podporované v API (viď dokumentácia)
- Môžeme pridať v budúcnosti ak bude potreba

## 📝 Poznámky pre implementáciu

1. **Ceny sa získavajú z API** - nemusíme ich hardcodovať
2. **Validácia vzdialenosti** - API to rieši automaticky
3. **Po prijatí technickej dokumentácie** - možno bude potrebné upraviť implementáciu
4. **Postman kolekcia** - použijeme na testovanie pred produkciou

## ✅ Čo už máme implementované

- ✅ Shipment promise flow (v pláne)
- ✅ Error handling pre nedostupné zóny
- ✅ Retry logika pre network errors
- ✅ Webhook handling pre status updates

## 🔄 Čo treba ešte urobiť

1. ✅ Implementovať shipment promise flow (podľa plánu)
2. ⏳ Počkať na technickú dokumentáciu a Postman kolekciu
3. ⏳ Otestovať s Postman kolekciou
4. ⏳ Upraviť ak bude potrebné podľa špecifických požiadaviek

---

**Kontakt**: Bohdana (Wolt Drive)  
**Dátum emailu**: Nedávno  
**Status zmluvy**: Čaká sa na podpis
