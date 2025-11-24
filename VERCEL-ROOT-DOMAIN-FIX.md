# 🔧 Oprava Root Domény v Vercel - p0rnopizza.sk

## 📋 Problém

V Vercel Dashboard vidíš:
- ❌ `p0rnopizza.sk` - **Invalid Configuration**
- ✅ `www.p0rnopizza.sk` - **Valid Configuration**

Root doména má 307 redirect na www, ale SSL certifikát nie je platný, pretože DNS konfigurácia nie je správna.

---

## ✅ Riešenie

### Krok 1: Skontroluj DNS Záznamy v Websupport

Uisti sa, že máš tieto DNS záznamy:

#### Pre Root Doménu (`p0rnopizza.sk`):
```
Type: A
Name: @ (alebo prázdne)
Value: 76.76.21.21
TTL: 3600
```

**Dôležité:**
- ✅ Musí byť **A record**, nie CNAME
- ✅ Niektorí DNS provideri (vrátane Websupport) neumožňujú CNAME na root doméne
- ✅ IP adresa môže byť iná - skontroluj v Vercel, akú IP odporučili

#### Pre WWW Subdoménu (`www.p0rnopizza.sk`):
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### Krok 2: Skontroluj v Vercel, Akú IP Odporučili

1. **Vercel Dashboard** → **Settings** → **Domains**
2. **Klikni na `p0rnopizza.sk`** (root doména)
3. **Pozri sa na DNS inštrukcie:**
   - Ak odporúčajú **A record**, použij IP adresu, ktorú poskytli
   - Ak odporúčajú **CNAME**, ale Websupport to nepodporuje, použij **A record** s IP adresou

### Krok 3: Odstráň a Pridaj Root Doménu Znovu

Ak DNS záznamy sú správne, ale Vercel stále hlási "Invalid Configuration":

1. **V Vercel Dashboard:**
   - Klikni na `p0rnopizza.sk`
   - Klikni **"Remove"** alebo **"Delete"**
   - Potvrď odstránenie

2. **Počkaj 5 minút** (aby sa DNS cache vyčistil)

3. **Pridaj root doménu znovu:**
   - Klikni **"Add Domain"**
   - Zadaj: `p0rnopizza.sk`
   - Vyber **Production** environment
   - Klikni **"Add"**

4. **Vercel ti zobrazí DNS inštrukcie:**
   - Skontroluj, či odporúčajú A record alebo CNAME
   - Ak odporúčajú CNAME, ale Websupport to nepodporuje, použij A record

### Krok 4: Nastav DNS Záznamy v Websupport

1. **Prihlás sa do Websupport**
2. **Choď do DNS Management**
3. **Skontroluj existujúce záznamy:**
   - Ak existuje CNAME pre root (`@`), **odstráň ho**
   - Ak existuje A record pre root, skontroluj, či má správnu IP

4. **Pridaj/Uprav A record pre root:**
   - Type: `A`
   - Name: `@` (alebo prázdne)
   - Value: `76.76.21.21` (alebo IP, ktorú Vercel poskytol)
   - TTL: `3600`

5. **Uisti sa, že www je CNAME:**
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`
   - TTL: `3600`

6. **Ulož zmeny**

### Krok 5: Počkaj na DNS Propagáciu a SSL Generovanie

1. **DNS propagácia:** 5-30 minút
2. **Vercel automaticky skontroluje DNS** každých pár minút
3. **SSL certifikát sa vygeneruje automaticky** po úspešnej DNS propagácii (~5-10 minút)

### Krok 6: Skontroluj Status v Vercel

1. **Vercel Dashboard** → **Settings** → **Domains**
2. **Skontroluj status:**
   - `p0rnopizza.sk` by mal mať **Valid Configuration** (modrý checkmark)
   - `www.p0rnopizza.sk` by mal mať **Valid Configuration** (modrý checkmark)

---

## 🔍 Troubleshooting

### Problém: Stále "Invalid Configuration"

**Možné príčiny:**

1. **DNS záznamy nie sú správne:**
   - Skontroluj pomocou `dig p0rnopizza.sk A`
   - Mala by sa zobraziť IP adresa, ktorú si nastavil

2. **DNS propagácia ešte neprebehla:**
   - Počkaj 30-60 minút
   - Skontroluj na https://dnschecker.org

3. **CNAME konflikt:**
   - Niektorí DNS provideri neumožňujú CNAME na root doméne
   - V takom prípade **musíš** použiť A record

4. **Nesprávna IP adresa:**
   - Skontroluj v Vercel, akú IP odporúčajú
   - Môže sa zmeniť, ak Vercel zmení svoju infraštruktúru

### Riešenie: Skontroluj DNS Záznamy

```bash
# Skontroluj A record pre root doménu
dig p0rnopizza.sk A

# Skontroluj CNAME pre www
dig www.p0rnopizza.sk CNAME

# Skontroluj všetky záznamy
dig p0rnopizza.sk ANY
```

**Očakávaný výsledok:**
- A record pre `p0rnopizza.sk` by mal ukazovať na Vercel IP
- CNAME pre `www.p0rnopizza.sk` by mal ukazovať na `cname.vercel-dns.com`

---

## ⚠️ Dôležité Poznámky

1. **Root doména vs WWW:**
   - Root doména (`p0rnopizza.sk`) môže mať buď A record alebo CNAME
   - WWW subdoména (`www.p0rnopizza.sk`) musí mať CNAME
   - **NEMÔŽEŠ** mať A record pre www, ak chceš, aby fungoval redirect

2. **Vercel Redirect:**
   - Vercel automaticky nastaví 307 redirect z root na www
   - To je v poriadku a je to štandardná prax
   - Dôležité je, aby **oba** mali platný SSL certifikát

3. **SSL Certifikát:**
   - Vercel automaticky vygeneruje SSL certifikát pre obe domény
   - Certifikát obsahuje aj root aj www subdoménu
   - Po úspešnej DNS propagácii sa certifikát vygeneruje automaticky

---

## ✅ Checklist

- [ ] DNS záznamy sú správne nastavené (A pre root, CNAME pre www)
- [ ] Root doména je pridaná v Vercel
- [ ] WWW subdoména je pridaná v Vercel
- [ ] Počkané na DNS propagáciu (30-60 minút)
- [ ] Status root domény = **Valid Configuration** v Vercel
- [ ] Status www subdomény = **Valid Configuration** v Vercel
- [ ] SSL certifikát je vygenerovaný pre obe domény
- [ ] HTTPS funguje bez varovaní (`https://p0rnopizza.sk` a `https://www.p0rnopizza.sk`)

---

## 📚 Užitočné Linky

- [Vercel Domain Documentation](https://vercel.com/docs/concepts/projects/domains)
- [DNS Checker](https://dnschecker.org)
- [What's My DNS](https://www.whatsmydns.net)

---

✅ **Po oprave:** Obe domény by mali mať **Valid Configuration** a SSL certifikát by mal fungovať správne!

