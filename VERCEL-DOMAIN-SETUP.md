# 🌐 Vercel Domain Setup Guide - p0rnopizza.sk

## 📋 Prehľad

Tento guide ti pomôže nastaviť custom doménu `p0rnopizza.sk` na Vercel a odstrániť "Invalid Configuration" chybu.

---

## ✅ Krok 1: Konfigurácia v Vercel Dashboard

### 1.1 Pridanie Domény

1. **Choď do Vercel Dashboard** → **Tvoj projekt** → **Settings** → **Domains**
2. **Klikni "Add"** alebo **"Add Domain"**
3. **Zadaj doménu:** `p0rnopizza.sk`
4. **Vyber možnosť:** "Connect to an environment" → **Production**
5. **Klikni "Save"**

### 1.2 Čo sa stane po uložení

Vercel ti zobrazí DNS záznamy, ktoré musíš pridať do tvojho DNS providera.

---

## 🔧 Krok 2: DNS Konfigurácia

### 2.1 DNS Záznamy od Vercel

Po pridaní domény v Vercel, dostaneš tieto DNS záznamy:

#### Pre Root Domain (p0rnopizza.sk):
```
Type: A
Name: @
Value: 76.76.21.21
```

ALEBO

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

#### Pre WWW Subdomain (www.p0rnopizza.sk):
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Poznámka:** Vercel môže odporučiť buď A record alebo CNAME. CNAME je zvyčajne jednoduchšie.

### 2.2 Pridanie DNS Záznamov

1. **Prihlás sa do tvojho DNS providera** (napr. GoDaddy, Namecheap, Cloudflare, atď.)
2. **Nájdi DNS Management / DNS Settings**
3. **Pridaj záznamy podľa toho, čo Vercel odporučil:**

   **Ak Vercel odporučil A record:**
   - Type: `A`
   - Name: `@` (alebo prázdne, závisí od providera)
   - Value: `76.76.21.21` (alebo IP, ktorú Vercel poskytol)
   - TTL: `3600` (alebo auto)

   **Ak Vercel odporučil CNAME:**
   - Type: `CNAME`
   - Name: `@` (alebo prázdne)
   - Value: `cname.vercel-dns.com`
   - TTL: `3600` (alebo auto)

4. **Pre WWW subdomain:**
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`
   - TTL: `3600`

5. **Ulož zmeny**

---

## ⏳ Krok 3: Čakanie na DNS Propagation

### 3.1 Čas propagácie

- **Typicky:** 5-30 minút
- **Môže trvať:** až 48 hodín (zriedkavo)
- **Vercel automaticky skontroluje** DNS záznamy každých pár minút

### 3.2 Kontrola DNS

Môžeš skontrolovať DNS propagáciu pomocou:

```bash
# V termináli
dig p0rnopizza.sk
nslookup p0rnopizza.sk

# Alebo online nástroje:
# - https://dnschecker.org
# - https://www.whatsmydns.net
```

---

## ✅ Krok 4: Overenie v Vercel

### 4.1 Automatická verifikácia

1. **Vercel automaticky skontroluje DNS** každých pár minút
2. **Status sa zmení z "Invalid Configuration" na "Valid"**
3. **SSL certifikát sa automaticky vygeneruje** (Let's Encrypt)

### 4.2 Manuálna kontrola

1. **Choď do Settings → Domains**
2. **Klikni na doménu `p0rnopizza.sk`**
3. **Skontroluj status:**
   - ✅ **Valid** = všetko funguje
   - ⚠️ **Pending** = čaká sa na DNS propagáciu
   - ❌ **Invalid Configuration** = DNS nie je správne nastavené

---

## 🔍 Krok 5: Troubleshooting

### Problém: Stále "Invalid Configuration"

**Možné príčiny:**

1. **DNS záznamy nie sú správne nastavené**
   - Skontroluj, či sú záznamy presne tak, ako Vercel odporučil
   - Skontroluj, či nie sú duplicitné záznamy

2. **DNS propagácia ešte neprebehla**
   - Počkaj 30-60 minút
   - Skontroluj DNS pomocou online nástrojov

3. **Nesprávny DNS provider**
   - Uisti sa, že DNS záznamy sú v správnom DNS provideri
   - Skontroluj, či doména používa správne nameservery

4. **CNAME konflikt**
   - Niektorí DNS provideri neumožňujú CNAME na root doméne
   - V takom prípade použij A record namiesto CNAME

### Riešenie: Skontroluj DNS Záznamy

```bash
# Skontroluj A record
dig p0rnopizza.sk A

# Skontroluj CNAME
dig p0rnopizza.sk CNAME

# Skontroluj všetky záznamy
dig p0rnopizza.sk ANY
```

**Očakávaný výsledok:**
- A record by mal ukazovať na Vercel IP (`76.76.21.21`)
- ALEBO CNAME by mal ukazovať na `cname.vercel-dns.com`

---

## 🌐 Krok 6: Multi-Domain Setup (Ak potrebuješ)

Ak máš viac domén (napr. `p0rnopizza.sk` a `pizzavnudzi.sk`):

1. **Pridaj každú doménu samostatne** v Settings → Domains
2. **Nastav každú na Production environment**
3. **Pridaj DNS záznamy pre každú doménu**
4. **Middleware automaticky detekuje tenant z domény**

---

## 🔐 Krok 7: SSL Certifikát

### Automatický SSL

- ✅ Vercel **automaticky** vygeneruje SSL certifikát (Let's Encrypt)
- ✅ Certifikát sa obnoví automaticky
- ✅ **HTTPS je povolené automaticky**

### Overenie SSL

Po úspešnej DNS propagácii:
1. **SSL certifikát sa vygeneruje automaticky** (~5-10 minút)
2. **Status domény sa zmení na "Valid"**
3. **Môžeš pristupovať cez HTTPS:** `https://p0rnopizza.sk`

---

## 📝 Krok 8: Aktualizácia Middleware (Ak potrebuješ)

Ak používaš `p0rnopizza.sk` (s nulou) namiesto `pornopizza.sk`, možno budeš musieť aktualizovať middleware:

```typescript
// frontend/middleware.ts
else if (hostname.includes('p0rnopizza.sk')) {
  tenant = 'pornopizza';
}
```

**Poznámka:** Skontroluj, či middleware už podporuje `p0rnopizza.sk`.

---

## ✅ Krok 9: Finálne Overenie

### 9.1 Testovanie Domény

1. **Otvoriť v prehliadači:**
   ```
   https://p0rnopizza.sk
   ```

2. **Skontrolovať:**
   - ✅ Stránka sa načíta
   - ✅ HTTPS funguje (zelený zámok)
   - ✅ Tenant sa správne detekuje
   - ✅ Produkty sa načítajú

### 9.2 Testovanie WWW

```
https://www.p0rnopizza.sk
```

Malo by fungovať rovnako.

---

## 🎯 Časté Otázky

### Q: Môžem použiť A record aj CNAME?

**A:** Pre root doménu (`@`) môžeš použiť buď A record alebo CNAME, ale nie oba. Vercel odporučí jeden z nich.

### Q: Ako dlho trvá DNS propagácia?

**A:** Typicky 5-30 minút, ale môže trvať až 48 hodín.

### Q: Prečo stále vidím "Invalid Configuration"?

**A:** 
- Skontroluj DNS záznamy
- Počkaj na propagáciu
- Skontroluj, či nameservery sú správne

### Q: Môžem pridať viac domén?

**A:** Áno, pridaj každú doménu samostatne v Settings → Domains.

---

## 📚 Užitočné Linky

- [Vercel Domain Documentation](https://vercel.com/docs/concepts/projects/domains)
- [DNS Checker](https://dnschecker.org)
- [What's My DNS](https://www.whatsmydns.net)

---

## ✅ Checklist

- [ ] Doména pridaná v Vercel Dashboard
- [ ] DNS záznamy pridané v DNS provideri
- [ ] Počkané na DNS propagáciu (30-60 min)
- [ ] Status domény = "Valid" v Vercel
- [ ] SSL certifikát vygenerovaný
- [ ] HTTPS funguje (`https://p0rnopizza.sk`)
- [ ] WWW subdomain funguje (`https://www.p0rnopizza.sk`)
- [ ] Tenant sa správne detekuje
- [ ] Produkty sa načítajú

---

✅ **Hotovo!** Doména by teraz mala fungovať!

