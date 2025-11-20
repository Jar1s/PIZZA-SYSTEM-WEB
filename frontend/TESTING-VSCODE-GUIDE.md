# Ako spúšťať testy v VS Code

## Krok 1: Nainštaluj Vitest Extension

1. **Otvori Extensions:**
   - Stlač `Cmd+Shift+X` (Mac) alebo `Ctrl+Shift+X` (Windows/Linux)
   - Alebo klikni na ikonu Extensions v sidebar (ľavá strana)

2. **Vyhľadaj Vitest:**
   - Do vyhľadávacieho poľa napíš: `Vitest`
   - Vyber **"Vitest"** od autora **"Anthony Fu"**
   - Klikni **"Install"**

3. **Reštartuj VS Code:**
   - Po inštalácii reštartuj VS Code (Cmd+Q a znova otvor)

## Krok 2: Otvor Testing Panel

### Spôsob 1: Cez ikonu v sidebar
- V ľavom sidebar nájdi ikonu **flasky** (🧪) - to je Testing panel
- Klikni na ňu
- Zobrazia sa všetky testy

### Spôsob 2: Cez Command Palette
1. Stlač `Cmd+Shift+P` (Mac) alebo `Ctrl+Shift+P` (Windows/Linux)
2. Napíš: `Test: Focus on Test View`
3. Stlač Enter

### Spôsob 3: Cez menu
- Menu → View → Testing

## Krok 3: Spustiť testy

### V Testing paneli:
- Klikni na **▶️ Run All Tests** (hore v paneli)
- Alebo klikni na **▶️** vedľa jednotlivého testu

### Cez Command Palette:
1. `Cmd+Shift+P` / `Ctrl+Shift+P`
2. Napíš: `Vitest: Run All Tests`
3. Enter

### Priamo v kóde:
- Nad každým `describe` alebo `it` sa zobrazí **"Run"** alebo **"Debug"**
- Klikni na **"Run"** → spustí sa ten konkrétny test

## Krok 4: Pozri výsledky

- ✅ Zelená ikona = test prešiel
- ❌ Červená ikona = test zlyhal
- ⏸️ Šedá ikona = test preskočený

Klikni na test → zobrazia sa detaily (čo zlyhalo, aký bol výstup)

## Rýchle príkazy

- **Run All Tests:** `Cmd+Shift+P` → `Vitest: Run All Tests`
- **Run Current Test:** Klikni na "Run" nad testom
- **Watch Mode:** `Cmd+Shift+P` → `Vitest: Watch`
- **Stop Tests:** `Cmd+Shift+P` → `Vitest: Stop`

## Riešenie problémov

### Ak nevidíš Testing panel:
1. Skontroluj, či máš nainštalovaný Vitest extension
2. Reštartuj VS Code
3. Skús otvoriť súbor s testom (napr. `useCart.test.ts`)

### Ak sa testy nespúšťajú:
1. Skontroluj, či beží backend (`npm run dev` v backend priečinku)
2. Skús spustiť testy v termináli: `cd frontend && npm run test`
3. Skontroluj, či máš správne nastavené `vitest.config.ts`

### Ak extension nefunguje:
1. Skontroluj VS Code verziu (potrebuješ najnovšiu)
2. Odinštaluj a znova nainštaluj extension
3. Skús iný extension: "Vitest Test Explorer" od "kavod"

