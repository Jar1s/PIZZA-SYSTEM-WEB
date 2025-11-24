# 🔐 SSL Certifikát a Telekom Blokovanie - Riešenie

## 📋 Prehľad Problémov

1. **SSL Certifikát:** Safari hovorí "This Connection Is Not Private" pre `www.p0rnopizza.sk`
2. **Telekom OnNet Security:** Blokuje prístup k stránke kvôli kategorizácii

---

## 🔐 Problém 1: SSL Certifikát

### Príčina

Safari varuje, že SSL certifikát nie je platný alebo nie je správne nastavený. Môže to byť kvôli:
- SSL certifikát sa ešte negeneroval
- DNS záznamy nie sú správne nastavené
- Problém s www vs non-www verziou
- Certifikát neobsahuje www subdoménu

### Riešenie

#### Krok 1: Skontroluj Status v Vercel

1. **Choď do Vercel Dashboard** → **Tvoj projekt** → **Settings** → **Domains**
2. **Skontroluj status domén:**
   - `p0rnopizza.sk` - mal by byť **Valid**
   - `www.p0rnopizza.sk` - mal by byť **Valid**

#### Krok 2: Skontroluj DNS Záznamy

Uisti sa, že máš správne DNS záznamy v Websupport:

**Pre root doménu (`p0rnopizza.sk`):**
```
Type: A
Name: @ (alebo prázdne)
Value: 76.76.21.21 (alebo IP, ktorú Vercel poskytol)
TTL: 3600
```

**Pre www subdoménu (`www.p0rnopizza.sk`):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

**Dôležité:**
- ✅ Musíš mať **OBIDVE** domény pridané v Vercel
- ✅ Musíš mať **OBIDVE** DNS záznamy v Websupport
- ✅ **NEMÔŽEŠ** mať A record pre www (musí byť CNAME)

#### Krok 3: Vymazať a Pridať Domény Znovu (Ak potrebuješ)

Ak SSL stále nefunguje:

1. **V Vercel Dashboard:**
   - Odstráň doménu `www.p0rnopizza.sk`
   - Odstráň doménu `p0rnopizza.sk`
   - Počkaj 5 minút

2. **Pridaj domény znovu:**
   - Najprv pridaj `p0rnopizza.sk` (root)
   - Potom pridaj `www.p0rnopizza.sk` (www)
   - Obe nastav na **Production**

3. **Počkaj na SSL generovanie:**
   - Vercel automaticky vygeneruje SSL certifikát (~5-10 minút)
   - Status sa zmení na **Valid**

#### Krok 4: Skontroluj SSL Certifikát

```bash
# V termináli
openssl s_client -connect www.p0rnopizza.sk:443 -servername www.p0rnopizza.sk

# Alebo online:
# https://www.ssllabs.com/ssltest/analyze.html?d=www.p0rnopizza.sk
```

**Očakávaný výsledok:**
- Certifikát by mal byť platný
- Certifikát by mal obsahovať `p0rnopizza.sk` aj `www.p0rnopizza.sk`

#### Krok 5: Vymazať Cache v Safari

1. **Safari** → **Preferences** → **Privacy**
2. **Klikni "Manage Website Data"**
3. **Vyhľadaj `p0rnopizza.sk`**
4. **Klikni "Remove"**
5. **Zatvor a otvor Safari znovu**

---

## 🚫 Problém 2: Telekom OnNet Security Blokovanie

### Príčina

Telekom OnNet Security blokuje stránku kvôli:
- Názov domény (`p0rnopizza.sk`) môže byť kategorizovaný ako nebezpečný obsah
- Automatická kategorizácia na základe názvu
- Bezpečnostné filtre poskytovateľa internetu

### Riešenie

#### Možnosť 1: Kontaktovať Telekom (Odporúčané)

1. **Zavolaj na Telekom zákaznícku linku:**
   - Telefón: `*123` (z Telekom siete) alebo `0800 123 456`
   - Email: `info@telekom.sk`

2. **Požiadaj o:**
   - Odblokovanie domény `p0rnopizza.sk`
   - Vysvetli, že ide o legitímnu pizzeriu
   - Požiadaj o re-kategorizáciu domény

3. **Poskytni informácie:**
   - Doména: `p0rnopizza.sk`
   - Typ stránky: Pizzeria / Food delivery
   - SSL certifikát: Platný (Let's Encrypt)
   - Legitímny business

#### Možnosť 2: OnNet Security Portal

1. **Prihlás sa do OnNet Security portálu** (ak máš prístup)
2. **Nájdi "Whitelist" alebo "Allow List"**
3. **Pridaj doménu:** `p0rnopizza.sk`
4. **Ulož zmeny**

#### Možnosť 3: Zmeniť DNS Provider (Ak nič nepomôže)

Ak Telekom nechce odblokovať, môžeš:
1. **Použiť iný DNS provider:**
   - Google DNS: `8.8.8.8`, `8.8.4.4`
   - Cloudflare DNS: `1.1.1.1`, `1.0.0.1`
   - OpenDNS: `208.67.222.222`, `208.67.220.220`

2. **Zmeniť DNS v zariadení:**
   - **iPhone:** Settings → Wi-Fi → (i) → DNS → Configure DNS → Manual
   - **Android:** Settings → Network → Advanced → Private DNS
   - **Mac:** System Preferences → Network → Advanced → DNS

**Poznámka:** Toto rieši problém len pre tvoje zariadenie, nie pre všetkých zákazníkov.

---

## ✅ Checklist

### SSL Certifikát:
- [ ] Obe domény (`p0rnopizza.sk` a `www.p0rnopizza.sk`) sú pridané v Vercel
- [ ] Obe domény majú status **Valid** v Vercel
- [ ] DNS záznamy sú správne nastavené (A pre root, CNAME pre www)
- [ ] SSL certifikát je vygenerovaný (status = Valid)
- [ ] SSL certifikát obsahuje obe domény
- [ ] Cache v Safari je vymazaný
- [ ] HTTPS funguje bez varovaní

### Telekom Blokovanie:
- [ ] Kontaktovaný Telekom zákaznícky servis
- [ ] Doména je odblokovaná v OnNet Security
- [ ] Alternatívne: DNS zmenený na iný provider (pre testovanie)

---

## 🔍 Troubleshooting

### SSL stále nefunguje:

1. **Skontroluj DNS propagáciu:**
   ```bash
   dig www.p0rnopizza.sk
   dig p0rnopizza.sk
   ```

2. **Skontroluj SSL certifikát:**
   ```bash
   openssl s_client -connect www.p0rnopizza.sk:443 -servername www.p0rnopizza.sk
   ```

3. **Kontaktuj Vercel Support:**
   - Vercel Dashboard → Help → Contact Support
   - Opíš problém s SSL certifikátom

### Telekom stále blokuje:

1. **Skontroluj, či je problém len na Telekom sieti:**
   - Testuj z inej siete (napr. mobilné dáta)
   - Testuj z iného poskytovateľa internetu

2. **Kontaktuj Telekom znovu:**
   - Požiadaj o eskaláciu problému
   - Požiadaj o kontakt s OnNet Security tímom

3. **Zváž zmenu DNS providera:**
   - Pre seba: zmeň DNS v zariadení
   - Pre zákazníkov: informuj ich, ako zmeniť DNS

---

## 📚 Užitočné Linky

- [Vercel SSL Documentation](https://vercel.com/docs/concepts/projects/domains/ssl-certificates)
- [Telekom Kontakt](https://www.telekom.sk/kontakt)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [DNS Checker](https://dnschecker.org)

---

## ⚠️ Dôležité Poznámky

1. **SSL certifikát sa generuje automaticky** po úspešnej DNS propagácii
2. **Telekom blokovanie nie je problém na strane aplikácie** - je to bezpečnostné opatrenie poskytovateľa internetu
3. **Pre zákazníkov:** Môžu zmeniť DNS provider, ak Telekom nechce odblokovať
4. **Pre business:** Kontaktuj Telekom a požiadaj o odblokovanie legitímnej domény

---

✅ **Po vyriešení:** Obe domény by mali fungovať cez HTTPS bez varovaní!

