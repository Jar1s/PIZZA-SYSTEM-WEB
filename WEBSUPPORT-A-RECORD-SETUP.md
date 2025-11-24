# 🔧 Websupport - Nastavenie A Záznamu pre Vercel

## 📋 Konkrétne Inštrukcie pre Formulár

Vidím, že máš otvorený formulár na vytvorenie A záznamu v Websupport. Tu je presne, čo máš vyplniť:

---

## ✅ Pre Root Domain (p0rnopizza.sk)

### Pole 1: "Pre adresu"
```
@
```
**ALEBO** nechaj prázdne (závisí od Websupport - skús najprv `@`)

### Pole 2: "Cieľová IP"
```
76.76.21.21
```
Toto je Vercel IP adresa pre root doménu.

### Pole 3: "TTL"
```
600
```
Ponechaj predvolené (600 sekúnd = 10 minút) alebo zmeň na `3600` (1 hodina).

### Pole 4: "Poznámka" (voliteľné)
```
Vercel - Production
```
Alebo akúkoľvek poznámku pre tvoju referenciu.

### Potom klikni: **"Uložiť zmeny"**

---

## ✅ Pre WWW Subdomain (www.p0rnopizza.sk)

**POZNÁMKA:** Pre WWW subdomain by si mal použiť **CNAME** namiesto A záznamu!

Ak Websupport neumožňuje CNAME na root doméne, môžeš použiť A záznam aj pre www, ale CNAME je lepšie.

### Ak vytváraš CNAME pre www:
1. **Choď späť** a vyber **"CNAME"** namiesto "A"
2. **Pre adresu:** `www`
3. **Cieľová doména:** `cname.vercel-dns.com`
4. **TTL:** `600` alebo `3600`
5. **Uložiť zmeny**

### Ak musíš použiť A záznam pre www:
1. **Pre adresu:** `www`
2. **Cieľová IP:** `76.76.21.21` (rovnaká ako pre root)
3. **TTL:** `600` alebo `3600`
4. **Uložiť zmeny**

---

## ⚠️ Dôležité Upozornenia

### 1. Zachovaj Existujúce Záznamy
- **NEODSTRAŇUJ** MX záznamy (pre email)
- **NEODSTRAŇUJ** TXT záznamy (pre verifikácie)
- **Zmeň len A záznam** pre root doménu

### 2. Ak Už Existuje A Záznam
- Ak už existuje A záznam pre `@`, **uprav ho** namiesto vytvárania nového
- Klikni na existujúci A záznam a zmeň IP na `76.76.21.21`

### 3. DNS Propagácia
- Zmeny sa prejavia za **30-60 minút**
- Vercel automaticky skontroluje DNS každých pár minút
- Status sa zmení z "Invalid Configuration" na "Valid"

---

## 🔍 Kontrola po Uložení

### 1. V Websupport
- Skontroluj, či sa A záznam zobrazuje v zozname DNS záznamov
- Over, či IP adresa je správna: `76.76.21.21`

### 2. V Vercel
- Choď do **Settings → Domains**
- Klikni na doménu `p0rnopizza.sk`
- Status by sa mal zmeniť z "Invalid Configuration" na "Valid" (po propagácii)

### 3. Online DNS Checker
- Choď na https://dnschecker.org
- Zadaj `p0rnopizza.sk`
- Skontroluj, či A záznam ukazuje na `76.76.21.21`

---

## 📝 Príklad Kompletnej Konfigurácie

### Po nastavení by si mal mať:

```
A     @     → 76.76.21.21        (Vercel - root domain)
CNAME www   → cname.vercel-dns.com (Vercel - www subdomain)
MX    @     → mail.websupport.sk  (Email - ZACHOVANÉ!)
TXT   @     → "v=spf1..."         (Email verification - ZACHOVANÉ!)
```

---

## 🆘 Troubleshooting

### Problém: "Pre adresu" neprijíma `@`

**Riešenie:**
- Skús nechať pole prázdne
- Alebo zadaj len `.` (bodku)
- Websupport môže mať rôzne formáty

### Problém: IP adresa sa neuložila

**Riešenie:**
- Skontroluj, či je IP adresa v správnom formáte (4 čísla oddelené bodkami)
- Skontroluj, či nemáš duplicitný A záznam
- Skús odstrániť starý A záznam a vytvoriť nový

### Problém: Po uložení stále "Invalid Configuration" v Vercel

**Riešenie:**
- Počkaj 30-60 minút na DNS propagáciu
- Skontroluj DNS pomocou online nástrojov
- Over, či IP adresa je správne uložená v Websupport

---

## ✅ Checklist

- [ ] A záznam vytvorený/upravený pre `@` (root domain)
- [ ] IP adresa nastavená na `76.76.21.21`
- [ ] TTL nastavené (600 alebo 3600)
- [ ] Zmeny uložené v Websupport
- [ ] MX záznamy zachované (email stále funguje)
- [ ] Čakám 30-60 minút na propagáciu
- [ ] Skontroloval som DNS pomocou online nástroja
- [ ] Status v Vercel sa zmenil na "Valid"

---

✅ **Hotovo!** Po uložení počkaj na DNS propagáciu a Vercel automaticky overí doménu!

