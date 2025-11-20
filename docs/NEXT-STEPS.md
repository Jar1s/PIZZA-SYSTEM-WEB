# 🎯 Ďalšie Kroky - Priority List

## 🔴 Priorita 1: Dokončiť migráciu komponentov

Ešte **9 súborov** používa hardcoded `isPornopizza` namiesto tenant theme:

### Komponenty na opravu:

1. ✅ `Header.tsx` - **HOTOVO**
2. ✅ `HomePageClient.tsx` - **HOTOVO**
3. ⏳ `Cart.tsx` - **POTREBUJE OPRAVU** (12 výskytov)
4. ⏳ `checkout/page.tsx` - **POTREBUJE OPRAVU** (22 výskyty)
5. ⏳ `auth/login/page.tsx` - **POTREBUJE OPRAVU** (26 výskytov)
6. ⏳ `ProductCard.tsx` - **POTREBUJE OPRAVU** (11 výskytov)
7. ⏳ `HeroSection.tsx` - **POTREBUJE OPRAVU** (prop `isPornopizza` → `isDarkTheme`)
8. ⏳ `LanguageSwitcher.tsx` - **POTREBUJE KONTROLU**
9. ⏳ `order/success/page.tsx` - **POTREBUJE KONTROLU**

### Ako opraviť:

**Vzorka pre Cart.tsx:**
```typescript
// PRED:
const [isPornopizza, setIsPornopizza] = useState(false);
useEffect(() => {
  // ... detect tenant slug
  setIsPornopizza(tenantSlug === 'pornopizza');
}, []);

// PO:
// Potrebuje tenant prop alebo context
const layout = tenant?.theme?.layout || {};
const isDarkTheme = layout.headerStyle === 'dark';
```

**Problém:** Niektoré komponenty nemajú prístup k `tenant` objektu. Riešenie:
- Pridať `tenant` prop
- Alebo vytvoriť `TenantContext`
- Alebo načítať tenant v komponente

---

## 🟡 Priorita 2: Spustiť databázovú migráciu

```bash
cd backend
npm run prisma:migrate-theme
```

Alebo:
```bash
psql $DATABASE_URL -f backend/prisma/migrations/20250120000000_update_tenant_theme_layout/migration.sql
```

---

## 🟢 Priorita 3: Testovanie

### SEO Test
```bash
# Skontrolovať, či produkty sú v HTML
curl http://localhost:3001 | grep -i "pizza"
```

### Theme Test
1. Otvoriť Pornopizza - mal by byť dark theme
2. Otvoriť Pizza v Núdzi - mal by byť light theme
3. Skontrolovať všetky komponenty (Cart, Checkout, Login)

### Funkčnosť
1. ✅ Produkty sa zobrazujú
2. ✅ Košík funguje
3. ✅ Checkout funguje
4. ✅ Login funguje
5. ✅ Rôzne tenanty majú rôzne témy

---

## 🔵 Priorita 4: Vylepšenia (voliteľné)

### A. Tenant Context
Vytvoriť `TenantContext` pre jednoduchší prístup k tenant dátam vo všetkých komponentoch:

```typescript
// frontend/contexts/TenantContext.tsx
export const TenantContext = createContext<Tenant | null>(null);

// Použitie:
const tenant = useContext(TenantContext);
const isDarkTheme = tenant?.theme?.layout?.headerStyle === 'dark';
```

### B. Admin Panel - Theme Editor
Pridať do admin panelu možnosť editovať tenant theme:
- Header style (dark/light)
- Custom logo component
- Background class
- atď.

### C. Type Safety
Vytvoriť utility funkciu pre získanie layout configu:

```typescript
// frontend/lib/tenant-utils.ts
export function getLayoutConfig(tenant: Tenant) {
  const layout = tenant.theme?.layout || {};
  return {
    headerStyle: layout.headerStyle || 'light',
    isDarkTheme: layout.headerStyle === 'dark',
    useCustomLogo: layout.useCustomLogo || false,
    // ...
  };
}
```

---

## 📋 Odporúčaný Poriadok

1. **TERAZ**: Dokončiť migráciu komponentov (Priorita 1)
2. **POTOM**: Spustiť databázovú migráciu (Priorita 2)
3. **POTOM**: Testovanie (Priorita 3)
4. **NESKÔR**: Vylepšenia (Priorita 4)

---

## 🚀 Rýchly Start

Ak chceš dokončiť migráciu teraz:

```bash
# 1. Spustiť migráciu komponentov (ja to môžem urobiť)
# 2. Spustiť databázovú migráciu
cd backend
npm run prisma:migrate-theme

# 3. Testovať
npm run start:dev  # Backend
cd ../frontend
npm run dev        # Frontend
```

---

## ❓ Otázky

- **Chceš, aby som dokončil migráciu všetkých komponentov teraz?**
- **Alebo chceš najprv spustiť databázovú migráciu a testovať?**
- **Alebo chceš niečo iné?**

