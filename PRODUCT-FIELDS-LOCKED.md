# 🔒 Uzamknuté polia produktov

## Prehľad

Polia `name`, `description` a `priceCents` sú **uzamknuté** a **nedajú sa meniť** po vytvorení produktu.

## Ako to funguje

### 1. **Databázová ochrana (SQL Trigger)**
- Trigger `lock_product_fields_trigger` zabráni UPDATE na chránené polia
- Ak sa pokúsite zmeniť `name`, `description` alebo `priceCents`, databáza vyhodí chybu
- **Súbor:** `lock-product-fields.sql`

### 2. **Backend ochrana (NestJS)**
- `UpdateProductDto` neobsahuje `name`, `description`, `priceCents`
- `ProductsService.updateProduct()` odfiltruje chránené polia pred update
- Ak sa niekto pokúsi zmeniť chránené polia, backend ich ignoruje a zaloguje warning

## Ako aktivovať ochranu

### Krok 1: Spustite SQL skript v Supabase

```sql
-- Spustite súbor: lock-product-fields.sql
-- V Supabase SQL Editori
```

Toto vytvorí trigger, ktorý zabráni zmenám.

### Krok 2: Backend už je upravený ✅

Backend kód už obsahuje ochranu:
- `backend/src/products/dto/update-product.dto.ts` - neobsahuje chránené polia
- `backend/src/products/products.service.ts` - filtruje chránené polia

## Čo sa dá meniť

✅ **Povolené polia na UPDATE:**
- `taxRate` - daňová sadzba
- `category` - kategória
- `image` - obrázok produktu
- `modifiers` - modifikátory (veľkosti, prílohy)
- `isActive` - aktívny/neaktívny
- `isBestSeller` - bestseller
- `weightGrams` - gramáž
- `allergens` - alergény

❌ **Zakázané polia (uzamknuté):**
- `name` - názov produktu
- `description` - popis/zloženie
- `priceCents` - cena

## Ako dočasne odomknúť (ak je potrebné)

Ak potrebujete zmeniť chránené polia (napr. oprava chyby):

### 1. Odstráňte trigger:
```sql
DROP TRIGGER lock_product_fields_trigger ON products;
```

### 2. Vykonajte zmeny:
```sql
UPDATE products 
SET name = 'Nový názov', description = 'Nový popis', "priceCents" = 999
WHERE id = 'product-id';
```

### 3. Znovu vytvorte trigger:
```sql
CREATE TRIGGER lock_product_fields_trigger
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION prevent_product_field_updates();
```

## Testovanie

### Test 1: Skúste zmeniť name (malo by zlyhať)
```sql
UPDATE products 
SET name = 'Test' 
WHERE id = (SELECT id FROM products LIMIT 1);
-- Očakávaná chyba: "Cannot update product name. Field is locked."
```

### Test 2: Skúste zmeniť priceCents (malo by zlyhať)
```sql
UPDATE products 
SET "priceCents" = 999 
WHERE id = (SELECT id FROM products LIMIT 1);
-- Očakávaná chyba: "Cannot update product priceCents. Field is locked."
```

### Test 3: Zmena povoleného poľa (malo by fungovať)
```sql
UPDATE products 
SET "isActive" = false 
WHERE id = (SELECT id FROM products LIMIT 1);
-- ✅ Malo by fungovať bez chyby
```

## Dôvody uzamknutia

1. **Konzistencia dát** - zabráni náhodným zmenám
2. **Audit trail** - zmeny cien a názvov by mali byť cez špeciálne procesy
3. **Bezpečnosť** - ochrana pred neoprávnenými zmenami
4. **Integrita menu** - zabráni rozbitiu mapovania produktov

## Poznámky

- **Vytvorenie produktu:** Pri `CREATE` sa všetky polia dajú nastaviť normálne
- **Update produktu:** Pri `UPDATE` sú `name`, `description`, `priceCents` uzamknuté
- **Backend API:** Endpoint `PATCH /api/:tenantSlug/products/:id` automaticky ignoruje chránené polia

