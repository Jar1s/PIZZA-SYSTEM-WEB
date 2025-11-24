# 🔧 Oprava DNS Záznamov v Websupport - p0rnopizza.sk

## 📋 Aktuálny Stav DNS Záznamov

Z tvojho screenshotu vidím:

### A Records:
- ✅ `p0rnopizza.sk` → `216.198.79.1` (TTL 600) - **Môže byť stará IP!**
- ⚠️ `*.p0rnopizza.sk` → `37.9.175.196` (TTL 600) - **Môže kolidovať!**
- ℹ️ `admin.p0rnopizza.sk` → `45.13.137.4` (email služby)
- ℹ️ `mail.p0rnopizza.sk` → `45.13.137.4` (email služby)
- ℹ️ Ďalšie email subdomény (webmail, smtp, pop3, imap)

### Problém:
1. **IP adresa `216.198.79.1` môže byť stará** - Vercel môže používať inú IP
2. **Wildcard `*.p0rnopizza.sk` môže kolidovať** s root doménou
3. **CNAME pre `www` nie je viditeľný** - musíš skontrolovať v CNAME view

---

## ✅ Riešenie

### Krok 1: Skontroluj, Akú IP Odporúča Vercel

1. **Vercel Dashboard** → **Settings** → **Domains**
2. **Klikni na `p0rnopizza.sk`** (root doména)
3. **Pozri sa na DNS inštrukcie:**
   - Aký typ záznamu odporúčajú? (A alebo CNAME)
   - Akú IP adresu odporúčajú? (môže byť `76.76.21.21` alebo iná)

### Krok 2: Skontroluj CNAME Pre WWW

1. **V Websupport DNS nastaveniach:**
   - Klikni na **"CNAME"** v ľavom sidebar
   - Skontroluj, či existuje záznam pre `www.p0rnopizza.sk`
   - Mal by ukazovať na `cname.vercel-dns.com`

### Krok 3: Aktualizuj A Record Pre Root Doménu

**Ak Vercel odporúča A record s inou IP:**

1. **V Websupport:**
   - Nájdi A record pre `p0rnopizza.sk`
   - Klikni **"Upraviť"** (Edit)
   - Zmeň **"Cieľová IP"** na IP, ktorú Vercel odporúča
   - Ulož zmeny

**Príklad:**
```
Pre adresu: p0rnopizza.sk (alebo @)
Cieľová IP: 76.76.21.21 (alebo IP, ktorú Vercel poskytol)
TTL: 600 (alebo 3600)
Poznámka: Vercel - Production
```

### Krok 4: Zváž Odstránenie Wildcard Record

**Wildcard `*.p0rnopizza.sk` môže kolidovať s root doménou.**

**Ak nepotrebuješ wildcard:**

1. **V Websupport:**
   - Nájdi A record pre `*.p0rnopizza.sk`
   - Klikni na **košík** (Delete)
   - Potvrď odstránenie

**Alebo:**

**Ak potrebuješ wildcard pre iné subdomény:**
- Nechaj ho, ale uisti sa, že root doména má vyššiu prioritu
- V DNS, konkrétne záznamy majú vyššiu prioritu ako wildcard

### Krok 5: Skontroluj CNAME Pre WWW

1. **V Websupport:**
   - Klikni na **"CNAME"** v sidebar
   - Skontroluj, či existuje:
     ```
     Pre adresu: www
     Cieľová hodnota: cname.vercel-dns.com
     TTL: 600 (alebo 3600)
     ```

2. **Ak CNAME neexistuje:**
   - Klikni **"Pridať záznam"** alebo **"Add"**
   - Type: `CNAME`
   - Pre adresu: `www` (alebo `www.p0rnopizza.sk`)
   - Cieľová hodnota: `cname.vercel-dns.com`
   - TTL: `600` alebo `3600`
   - Ulož

### Krok 6: Počkaj na DNS Propagáciu

1. **DNS propagácia:** 30-60 minút
2. **Vercel automaticky skontroluje DNS** každých pár minút
3. **SSL certifikát sa vygeneruje** po úspešnej propagácii (~5-10 minút)

### Krok 7: Skontroluj Status v Vercel

1. **Vercel Dashboard** → **Settings** → **Domains**
2. **Skontroluj status:**
   - `p0rnopizza.sk` by mal mať **Valid Configuration** (modrý checkmark)
   - `www.p0rnopizza.sk` by mal mať **Valid Configuration** (modrý checkmark)

---

## 🔍 Troubleshooting

### Problém: Stále "Invalid Configuration"

**Možné príčiny:**

1. **Nesprávna IP adresa:**
   - Skontroluj v Vercel, akú IP odporúčajú
   - IP `216.198.79.1` môže byť stará

2. **Wildcard koliduje:**
   - Odstráň wildcard `*.p0rnopizza.sk`, ak ho nepotrebuješ
   - Alebo uisti sa, že root doména má vyššiu prioritu

3. **DNS propagácia ešte neprebehla:**
   - Počkaj 30-60 minút
   - Skontroluj na https://dnschecker.org

4. **CNAME pre www chýba:**
   - Skontroluj v CNAME view
   - Pridaj, ak chýba

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
- A record pre `p0rnopizza.sk` by mal ukazovať na IP, ktorú Vercel odporúča
- CNAME pre `www.p0rnopizza.sk` by mal ukazovať na `cname.vercel-dns.com`

---

## ⚠️ Dôležité Poznámky

1. **Email služby:**
   - **NEDOTÝKAJ SA** A records pre `admin`, `mail`, `webmail`, `smtp`, `pop3`, `imap`
   - Tieto sú pre email služby a musia zostať

2. **Wildcard record:**
   - Ak nepotrebuješ wildcard pre iné subdomény, odstráň ho
   - Môže kolidovať s root doménou

3. **TTL hodnoty:**
   - Môžeš zmeniť TTL z `600` na `3600` (1 hodina)
   - Nižšia TTL = rýchlejšie zmeny, ale viac DNS queries

4. **DNS propagácia:**
   - Zmeny môžu trvať 30-60 minút
   - Niektoré DNS servery môžu mať staršie hodnoty v cache

---

## ✅ Checklist

- [ ] Skontrolovaná IP adresa, ktorú Vercel odporúča
- [ ] A record pre `p0rnopizza.sk` má správnu IP (nie `216.198.79.1`, ak Vercel odporúča inú)
- [ ] CNAME pre `www.p0rnopizza.sk` existuje a ukazuje na `cname.vercel-dns.com`
- [ ] Wildcard `*.p0rnopizza.sk` je odstránený (ak nepotrebuješ)
- [ ] Email A records (`admin`, `mail`, atď.) zostali nezmenené
- [ ] Počkané na DNS propagáciu (30-60 minút)
- [ ] Status root domény = **Valid Configuration** v Vercel
- [ ] Status www subdomény = **Valid Configuration** v Vercel
- [ ] SSL certifikát je vygenerovaný
- [ ] HTTPS funguje bez varovaní

---

## 📚 Užitočné Linky

- [DNS Checker](https://dnschecker.org)
- [What's My DNS](https://www.whatsmydns.net)
- [Vercel Domain Documentation](https://vercel.com/docs/concepts/projects/domains)

---

✅ **Po oprave:** Obe domény by mali mať **Valid Configuration** a SSL certifikát by mal fungovať správne!

