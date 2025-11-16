# 📱 Porovnanie SMS služieb a integrácia

## Prečo Twilio nie je povinné?

**Twilio je len jedna z možností!** Môžete použiť akúkoľvek SMS službu. Systém je navrhnutý tak, aby sa ľahko prepol na inú službu.

## 🔍 Porovnanie SMS služieb

### 1. **Slovenské SMS služby** (Odporúčané pre Slovensko)

#### SMS.sk API
- **Web**: [https://www.sms.sk](https://www.sms.sk)
- **Ceny**: ~€0.03-0.05 za SMS na Slovensko
- **Výhody**: 
  - Najnižšie ceny pre slovenské čísla
  - Rýchle doručenie
  - Podpora v slovenčine
- **Nevýhody**: 
  - Len pre slovenské čísla
  - Menej funkcií ako Twilio

#### SMS Gate (smsgate.sk) ⭐ **NAJLACNEJŠIE!**
- **Web**: [https://www.smsgate.sk](https://www.smsgate.sk)
- **Cenník**: [https://www.smsgate.sk/cennik/](https://www.smsgate.sk/cennik/)
- **API**: [https://www.smsgate.sk/api](https://www.smsgate.sk/api)
- **Ceny**: 
  - Textový identifikátor: **€0.0275 za SMS** (bez DPH)
  - Voliteľný identifikátor: **€0.0285 za SMS** (bez DPH)
  - Virtuálne číslo: **€0.0330 za SMS** + €10/mesiac za číslo
- **Minimálny kredit**: €10 (€20 pre virtuálne číslo)
- **Výhody**: 
  - **Najnižšia cena** pre slovenské čísla (€0.0275)
  - Žiadne aktivačné poplatky
  - Kredit platný 12 mesiacov
  - Rovnaká cena do všetkých SK sietí (T-Com, Orange, O2, 4-ka)
  - API dokumentácia dostupná
  - Podpora Viber správ
- **Nevýhody**: 
  - Len pre slovenské čísla
  - Zahraničné SMS: €0.102 za SMS

#### SMS API (smsapi.sk)
- **Web**: [https://www.smsapi.sk](https://www.smsapi.sk)
- **Ceny**: ~€0.04-0.06 za SMS
- **Výhody**: 
  - Jednoduchá integrácia
  - Dobrá dokumentácia
- **Nevýhody**: 
  - Len pre slovenské čísla

#### Orange SMS Gateway
- **Web**: [https://developer.orange.com](https://developer.orange.com)
- **Ceny**: Podľa dohody
- **Výhody**: 
  - Priamo od operátora
  - Veľmi spoľahlivé
- **Nevýhody**: 
  - Zložitejšia registrácia
  - Vyššie ceny

### 2. **Medzinárodné služby**

#### Twilio
- **Web**: [https://www.twilio.com](https://www.twilio.com)
- **Ceny**: ~$0.05-0.10 za SMS na Slovensko, ~$0.0075 pre USA
- **Výhody**: 
  - Najlepšia dokumentácia
  - Podpora všetkých krajín
  - Bezplatný účet s kreditom ($15.50)
- **Nevýhody**: 
  - Drahšie pre slovenské čísla
  - Potrebujete telefónne číslo (~$1.50/mesiac)

#### MessageBird
- **Web**: [https://www.messagebird.com](https://www.messagebird.com)
- **Ceny**: ~€0.05-0.10 za SMS
- **Výhody**: 
  - Dobrá dokumentácia
  - Podpora viacerých krajín
- **Nevýhody**: 
  - Drahšie ako slovenské služby

#### Vonage (Nexmo)
- **Web**: [https://www.vonage.com](https://www.vonage.com)
- **Ceny**: ~€0.05 za SMS
- **Výhody**: 
  - Spoľahlivá služba
  - REST API
- **Nevýhody**: 
  - Menej populárna ako Twilio

## 💰 Porovnanie cien (pre Slovensko)

| Služba | Cena za SMS | Mesačný poplatok | Minimálny vklad |
|--------|-------------|-------------------|-----------------|
| **SMS Gate** ⭐ | **€0.0275** | €0 | €10 |
| **SMS.sk** | €0.03-0.05 | €0 | €10 |
| **SMS API** | €0.04-0.06 | €0 | €5 |
| **Twilio** | $0.05-0.10 | $1.50 (číslo) | $0 (kredit) |
| **MessageBird** | €0.05-0.10 | €0 | €0 |
| **Vonage** | €0.05 | €0 | €0 |

**Odporúčanie:**
- **Pre slovenské čísla**: **SMS Gate** (najlacnejšie - €0.0275 za SMS) ⭐
- **Pre medzinárodné**: Twilio alebo MessageBird
- **Pre testovanie**: Twilio (bezplatný kredit) alebo SMS Gate (€10 kredit)

## 🔧 Ako integrovať inú službu

📖 **Praktický príklad kódu**: Pozri `backend/src/auth/sms.service.example.ts` - obsahuje kompletnú implementáciu pre rôzne služby.

### Krok 1: Vyberte službu

**Odporúčame SMS Gate** pre slovenské čísla - **najlacnejšia cena** (€0.0275 za SMS bez DPH).

Alternatívy:
- **SMS.sk** - ~€0.03-0.05 za SMS
- **SMS API** - ~€0.04-0.06 za SMS

### Krok 2: Získajte API kľúč

1. Zaregistrujte sa na vybranej službe
2. Vytvorte API projekt
3. Skopírujte API kľúč

### Krok 3: Upravte kód

Upravte súbor `backend/src/auth/sms.service.ts`:

#### Príklad 1: SMS Gate API ⭐ (Najlacnejšie)

```typescript
private async sendSmsViaSmsGate(phone: string, code: string): Promise<void> {
  const formattedPhone = this.formatPhoneNumber(phone);
  
  // Odstráňte + z telefónneho čísla (SMS Gate potrebuje len čísla)
  const phoneWithoutPlus = formattedPhone.replace('+', '');
  
  try {
    // SMS Gate API endpoint (skontrolujte dokumentáciu na smsgate.sk/api)
    const response = await fetch('https://api.smsgate.sk/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SMSGATE_API_KEY}`,
      },
      body: JSON.stringify({
        phone: phoneWithoutPlus,
        message: `Vas overovaci kod je: ${code}. Platny 10 minut.`,
        sender: process.env.SMSGATE_SENDER || 'SMSGATE.sk', // alebo vlastný identifikátor
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok || data.error) {
      throw new Error(data.error || `SMS Gate API error: ${response.statusText}`);
    }
    
    this.logger.log(`✅ SMS verification code sent via SMS Gate to ${formattedPhone}`);
  } catch (error: any) {
    this.logger.error(`❌ Failed to send SMS via SMS Gate:`, error);
    throw new BadRequestException('Failed to send SMS verification code');
  }
}
```

**Environment premenné:**
```bash
SMSGATE_API_KEY=your_api_key_here
SMSGATE_SENDER=PornoPizza  # Voliteľný identifikátor (max 11 znakov)
```

**Ceny:**
- Textový identifikátor (SMSGATE.sk): €0.0275 za SMS
- Voliteľný identifikátor: €0.0285 za SMS
- Minimálny kredit: €10

#### Príklad 2: SMS.sk API

```typescript
private async sendSms(phone: string, code: string): Promise<void> {
  const formattedPhone = this.formatPhoneNumber(phone);
  
  // SMS.sk API (pre slovenské čísla)
  if (process.env.SMS_SK_API_KEY) {
    try {
      const response = await fetch('https://api.sms.sk/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SMS_SK_API_KEY}`,
        },
        body: JSON.stringify({
          phone: formattedPhone,
          message: `Vas overovaci kod je: ${code}. Platny 10 minut.`,
          sender: process.env.SMS_SK_SENDER || 'PornoPizza',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`SMS.sk API error: ${response.statusText}`);
      }
      
      this.logger.log(`SMS verification code sent via SMS.sk to ${formattedPhone}`);
      return;
    } catch (error: any) {
      this.logger.error(`Failed to send SMS via SMS.sk:`, error);
      throw new BadRequestException('Failed to send SMS verification code');
    }
  }
  
  // Twilio (pôvodná implementácia)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    // ... existujúci Twilio kód
    return;
  }
  
  // Fallback: DEV mode
  this.logger.log(`[DEV MODE] SMS Verification Code for ${formattedPhone}: ${code}`);
}
```

#### Príklad 2: MessageBird

```typescript
// Najprv nainštalujte: npm install messagebird
private async sendSms(phone: string, code: string): Promise<void> {
  const formattedPhone = this.formatPhoneNumber(phone);
  
  // MessageBird
  if (process.env.MESSAGEBIRD_API_KEY) {
    try {
      const messagebird = require('messagebird')(process.env.MESSAGEBIRD_API_KEY);
      
      await messagebird.messages.create({
        originator: process.env.MESSAGEBIRD_ORIGINATOR || 'PornoPizza',
        recipients: [formattedPhone],
        body: `Your verification code is: ${code}. Valid for 10 minutes.`,
      });
      
      this.logger.log(`SMS verification code sent via MessageBird to ${formattedPhone}`);
      return;
    } catch (error: any) {
      this.logger.error(`Failed to send SMS via MessageBird:`, error);
      throw new BadRequestException('Failed to send SMS verification code');
    }
  }
  
  // Twilio (fallback)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    // ... existujúci Twilio kód
    return;
  }
  
  // Fallback: DEV mode
  this.logger.log(`[DEV MODE] SMS Verification Code for ${formattedPhone}: ${code}`);
}
```

#### Príklad 3: Vonage (Nexmo)

```typescript
// Najprv nainštalujte: npm install @vonage/server-sdk
private async sendSms(phone: string, code: string): Promise<void> {
  const formattedPhone = this.formatPhoneNumber(phone);
  
  // Vonage (Nexmo)
  if (process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET) {
    try {
      const { Vonage } = require('@vonage/server-sdk');
      const vonage = new Vonage({
        apiKey: process.env.VONAGE_API_KEY,
        apiSecret: process.env.VONAGE_API_SECRET,
      });
      
      await vonage.sms.send({
        to: formattedPhone,
        from: process.env.VONAGE_FROM_NUMBER || 'PornoPizza',
        text: `Your verification code is: ${code}. Valid for 10 minutes.`,
      });
      
      this.logger.log(`SMS verification code sent via Vonage to ${formattedPhone}`);
      return;
    } catch (error: any) {
      this.logger.error(`Failed to send SMS via Vonage:`, error);
      throw new BadRequestException('Failed to send SMS verification code');
    }
  }
  
  // Twilio (fallback)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    // ... existujúci Twilio kód
    return;
  }
  
  // Fallback: DEV mode
  this.logger.log(`[DEV MODE] SMS Verification Code for ${formattedPhone}: ${code}`);
}
```

### Krok 4: Nastavte environment premenné

Pridajte do `.env` v `backend/`:

```bash
# Pre SMS.sk
SMS_SK_API_KEY=your_api_key_here
SMS_SK_SENDER=PornoPizza

# Pre MessageBird
MESSAGEBIRD_API_KEY=your_api_key_here
MESSAGEBIRD_ORIGINATOR=PornoPizza

# Pre Vonage
VONAGE_API_KEY=your_api_key_here
VONAGE_API_SECRET=your_api_secret_here
VONAGE_FROM_NUMBER=+421XXXXXXXXX
```

### Krok 5: Reštartujte backend

```bash
cd backend
npm run start:dev
```

## 🎯 Odporúčaná konfigurácia

### Pre slovenské čísla (najlacnejšie):

1. **Použite SMS.sk alebo SMS API**
2. **Cena**: ~€0.03-0.05 za SMS
3. **Integrácia**: Jednoduchá REST API

### Pre medzinárodné čísla:

1. **Použite Twilio alebo MessageBird**
2. **Cena**: ~$0.05-0.10 za SMS
3. **Integrácia**: SDK alebo REST API

### Pre testovanie:

1. **Použite Twilio** (bezplatný kredit $15.50)
2. **Alebo**: Nechajte prázdne (DEV mode - kód v konzole)

## 📝 Kompletný príklad: SMS.sk integrácia

Tu je kompletný príklad integrácie SMS.sk:

```typescript
// backend/src/auth/sms.service.ts
private async sendSms(phone: string, code: string): Promise<void> {
  const formattedPhone = this.formatPhoneNumber(phone);
  
  // SMS.sk API (priorita 1 - najlacnejšie pre Slovensko)
  if (process.env.SMS_SK_API_KEY) {
    try {
      // Odstráňte + z telefónneho čísla pre SMS.sk (potrebujú len čísla)
      const phoneWithoutPlus = formattedPhone.replace('+', '');
      
      const response = await fetch('https://api.sms.sk/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SMS_SK_API_KEY}`,
        },
        body: JSON.stringify({
          phone: phoneWithoutPlus,
          message: `Vas overovaci kod je: ${code}. Platny 10 minut.`,
          sender: process.env.SMS_SK_SENDER || 'PornoPizza',
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error || `SMS.sk API error: ${response.statusText}`);
      }
      
      this.logger.log(`✅ SMS verification code sent via SMS.sk to ${formattedPhone}`);
      return;
    } catch (error: any) {
      this.logger.error(`❌ Failed to send SMS via SMS.sk:`, error);
      // Fallback na Twilio ak SMS.sk zlyhá
    }
  }
  
  // Twilio (fallback alebo pre medzinárodné čísla)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      await client.messages.create({
        body: `Your verification code is: ${code}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone,
      });

      this.logger.log(`✅ SMS verification code sent via Twilio to ${formattedPhone}`);
      return;
    } catch (error: any) {
      this.logger.error(`❌ Failed to send SMS via Twilio:`, error);
      // Fallback na DEV mode
    }
  }
  
  // Fallback: DEV mode (log do konzoly)
  this.logger.log(`[DEV MODE] SMS Verification Code for ${formattedPhone}: ${code}`);
  this.logger.warn(`⚠️  No SMS provider configured. Code logged above.`);
}
```

## ✅ Výhody tejto implementácie

1. **Flexibilita**: Môžete použiť akúkoľvek službu
2. **Fallback**: Ak jedna služba zlyhá, použije sa iná
3. **Ceny**: Môžete zvoliť najlacnejšiu službu
4. **Lokalizácia**: Môžete použiť slovenské služby pre slovenské čísla

## 🚀 Rýchly štart s SMS.sk

1. Zaregistrujte sa na [sms.sk](https://www.sms.sk)
2. Vytvorte API kľúč
3. Pridajte do `.env`:
   ```bash
   SMS_SK_API_KEY=your_api_key_here
   SMS_SK_SENDER=PornoPizza
   ```
4. Upravte `sms.service.ts` podľa príkladu vyššie
5. Reštartujte backend

**Hotovo!** Teraz používate najlacnejšiu službu pre Slovensko. 🎉

