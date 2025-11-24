# 📋 Websupport - Ako Získať Potrebné Informácie

## 🌐 Prehľad

Tento guide ti ukáže, ako získať všetky potrebné informácie z Websupport pre konfiguráciu domény `p0rnopizza.sk`.

---

## 🔍 Krok 1: DNS Záznamy

### 1.1 Ako sa dostať k DNS nastaveniam

1. **Prihlás sa do Websupport** → https://www.websupport.sk
2. **Vyber doménu** `p0rnopizza.sk` z ľavého sidebaru
3. **Klikni na "DNS"** v ľavom menu

### 1.2 Čo nájdeš v DNS sekcii

V DNS sekcii uvidíš všetky aktuálne DNS záznamy:

- **A records** - IP adresy
- **CNAME records** - presmerovania na iné domény
- **MX records** - email servery
- **TXT records** - textové záznamy (verifikácie, SPF, DKIM)
- **NS records** - nameservery

### 1.3 Dôležité DNS záznamy pre Vercel

Pre pripojenie domény na Vercel potrebuješ:

#### Pre Root Domain (p0rnopizza.sk):
```
Type: A
Name: @ (alebo prázdne)
Value: 76.76.21.21
TTL: 3600
```

ALEBO

```
Type: CNAME
Name: @ (alebo prázdne)
Value: cname.vercel-dns.com
TTL: 3600
```

#### Pre WWW Subdomain:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### 1.4 Ako pridať/upraviť DNS záznamy v Websupport

1. **Choď do DNS sekcie** (ako je popísané vyššie)
2. **Klikni na "Pridať záznam"** alebo **"Upraviť"** pri existujúcom zázname
3. **Vyplň údaje:**
   - **Typ:** A alebo CNAME
   - **Názov:** `@` pre root doménu, alebo `www` pre subdomain
   - **Hodnota:** IP adresa (pre A) alebo doména (pre CNAME)
   - **TTL:** 3600 (alebo ponechaj predvolené)
4. **Ulož zmeny**

**⚠️ Dôležité:**
- Websupport môže mať limit na počet DNS záznamov
- Niektoré záznamy môžu byť chránené (napr. MX records pre email)
- Zmeny sa môžu prejaviť do 30-60 minút

---

## 📧 Krok 2: Email Nastavenia

### 2.1 Ako sa dostať k email nastaveniam

1. **Vyber doménu** `p0rnopizza.sk`
2. **Klikni na "Biznis Mail"** v ľavom menu
3. **Klikni na "Emaily"** → **"Mailové schránky"**
4. **Vyber email schránku** (napr. `info@p0rnopizza.sk`)

### 2.2 Dôležité email informácie

#### MX Records (pre email)
V DNS sekcii nájdeš MX záznamy, napr.:
```
Type: MX
Name: @
Value: mail.websupport.sk
Priority: 10
```

#### Email Server Informácie
Pre konfiguráciu email klienta potrebuješ:
- **Incoming Server (IMAP):** `imap.websupport.sk`
- **Outgoing Server (SMTP):** `smtp.websupport.sk`
- **Port IMAP:** 993 (SSL) alebo 143 (TLS)
- **Port SMTP:** 465 (SSL) alebo 587 (TLS)
- **Username:** `info@p0rnopizza.sk` (celý email)
- **Password:** tvoje email heslo

### 2.3 Email Forwarding / Presmerovania

1. **Choď do email schránky**
2. **Klikni na "Presmerovania"**
3. **Pridaj presmerovanie:**
   - **Od:** `info@p0rnopizza.sk`
   - **Do:** tvoj iný email

### 2.4 Email Aliases

1. **Klikni na "Aliasy"**
2. **Pridaj alias:**
   - **Alias:** `support@p0rnopizza.sk`
   - **Presmerovať na:** `info@p0rnopizza.sk`

---

## 🔄 Krok 3: Doménové Presmerovania

### 3.1 Ako sa dostať k presmerovaniam

1. **Vyber doménu** `p0rnopizza.sk`
2. **Klikni na "Doménové presmerovanie"** v ľavom menu

### 3.2 Typy presmerovaní

- **HTTP Presmerovanie** - presmeruje `http://p0rnopizza.sk` na inú URL
- **HTTPS Presmerovanie** - presmeruje `https://p0rnopizza.sk` na inú URL
- **WWW Presmerovanie** - presmeruje `www.p0rnopizza.sk` na `p0rnopizza.sk` (alebo naopak)

**⚠️ Pozor:** Ak používaš Vercel, **NEPOUŽÍVAJ** doménové presmerovanie v Websupport! Namiesto toho nastav DNS záznamy (A alebo CNAME) na Vercel.

---

## 🔐 Krok 4: Nameservery

### 4.1 Ako zistiť nameservery

1. **Choď do DNS sekcie**
2. **Pozri sa na NS záznamy**

Typicky Websupport nameservery:
```
ns1.websupport.sk
ns2.websupport.sk
```

### 4.2 Kedy potrebuješ nameservery

- Ak chceš presunúť DNS správu na iného poskytovateľa (napr. Cloudflare)
- Ak chceš overiť, že doména používa správne nameservery

---

## 📊 Krok 5: Export DNS Záznamov

### 5.1 Ako exportovať DNS záznamy

1. **Choď do DNS sekcie**
2. **Hľadaj tlačidlo "Export"** alebo **"Stiahnuť"**
3. **Stiahni zoznam všetkých DNS záznamov**

**Alternatíva:** Môžeš použiť terminál:
```bash
# Získaj všetky DNS záznamy
dig p0rnopizza.sk ANY

# Alebo konkrétny typ
dig p0rnopizza.sk MX    # Email servery
dig p0rnopizza.sk A     # IP adresy
dig p0rnopizza.sk CNAME # Presmerovania
```

---

## 🔧 Krok 6: Konkrétne Informácie pre Vercel Setup

### 6.1 Čo potrebuješ získať

1. **Aktuálne DNS záznamy** - aby si videl, čo už existuje
2. **Email MX záznamy** - ak chceš zachovať email funkčnosť
3. **TXT záznamy** - pre verifikácie (Google, Facebook, atď.)

### 6.2 Postup pre Vercel

1. **Získaj aktuálne DNS záznamy** (Krok 1)
2. **Zapíš si MX záznamy** (pre email)
3. **Zapíš si TXT záznamy** (pre verifikácie)
4. **Pridaj A alebo CNAME záznam** pre Vercel (podľa inštrukcií z Vercel)
5. **Zachovaj MX a TXT záznamy** (neodstraňuj ich!)

### 6.3 Príklad konfigurácie

**Pred pridaním Vercel:**
```
A     @     → 192.168.1.1 (starý server)
MX    @     → mail.websupport.sk (email)
TXT   @     → "v=spf1 include:websupport.sk ~all"
```

**Po pridaní Vercel:**
```
A     @     → 76.76.21.21 (Vercel)  ← ZMENENÉ
CNAME www   → cname.vercel-dns.com  ← PRIDANÉ
MX    @     → mail.websupport.sk    ← ZACHOVANÉ
TXT   @     → "v=spf1 include:websupport.sk ~all"  ← ZACHOVANÉ
```

---

## 🆘 Krok 7: Troubleshooting

### Problém: Neviem nájsť DNS sekciu

**Riešenie:**
- Uisti sa, že si prihlásený do správneho účtu
- Skontroluj, či máš prístup k doméne `p0rnopizza.sk`
- Kontaktuj Websupport podporu

### Problém: Nemôžem upraviť DNS záznamy

**Možné príčiny:**
- Doména používa externé nameservery (nie Websupport)
- Nemáš oprávnenia na úpravu DNS
- Záznam je chránený (napr. MX pre email)

**Riešenie:**
- Skontroluj nameservery v DNS sekcii
- Kontaktuj Websupport podporu

### Problém: Email prestal fungovať po zmene DNS

**Riešenie:**
- Skontroluj, či sú MX záznamy stále nastavené
- MX záznamy musia zostať nezmenené!
- Ak si ich omylom odstránil, pridaj ich späť

### Problém: Neviem, ktoré záznamy môžem zmeniť

**Bezpečné zmeny:**
- ✅ A záznamy (pre web)
- ✅ CNAME záznamy (pre subdomény)

**Nezmeniť:**
- ❌ MX záznamy (email)
- ❌ TXT záznamy (verifikácie, SPF, DKIM)
- ❌ NS záznamy (nameservery)

---

## 📝 Krok 8: Checklist pred zmenou DNS

Pred zmenou DNS záznamov pre Vercel:

- [ ] Získal som aktuálne DNS záznamy (export alebo screenshot)
- [ ] Zapísal som si MX záznamy (pre email)
- [ ] Zapísal som si TXT záznamy (pre verifikácie)
- [ ] Mám DNS záznamy od Vercel (A alebo CNAME)
- [ ] Viem, ktoré záznamy môžem zmeniť
- [ ] Viem, ktoré záznamy musím zachovať
- [ ] Mám backup aktuálnej konfigurácie

---

## 🔗 Užitočné Linky

- **Websupport Dashboard:** https://www.websupport.sk
- **Websupport Podpora:** https://www.websupport.sk/kontakt
- **DNS Checker:** https://dnschecker.org
- **What's My DNS:** https://www.whatsmydns.net

---

## 📞 Kontakt Websupport

Ak máš problémy s prístupom alebo nastavením:

- **Email:** podpora@websupport.sk
- **Telefón:** +421 2 33 456 789 (skontroluj aktuálne číslo)
- **Live Chat:** dostupný v Websupport dashboarde

---

## ✅ Rýchly Návod: DNS pre Vercel

1. **Prihlás sa do Websupport**
2. **Vyber doménu** `p0rnopizza.sk`
3. **Choď do "DNS"**
4. **Zapíš si MX záznamy** (pre email)
5. **Zmeň A záznam** na `76.76.21.21` (Vercel IP)
   - ALEBO pridaj CNAME: `@` → `cname.vercel-dns.com`
6. **Pridaj CNAME:** `www` → `cname.vercel-dns.com`
7. **Zachovaj MX záznamy** (neodstraňuj!)
8. **Ulož zmeny**
9. **Počkaj 30-60 minút** na propagáciu

---

✅ **Hotovo!** Teraz vieš, ako získať všetky potrebné informácie z Websupport!

