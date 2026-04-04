/**
 * PRÍKLAD: Ako integrovať inú SMS službu
 * 
 * Tento súbor ukazuje, ako upraviť sendSms() metódu pre inú službu.
 * Skopírujte relevantnú časť do backend/src/auth/sms.service.ts
 */

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SmsServiceExample {
  private readonly logger = new Logger(SmsServiceExample.name);

  /**
   * PRÍKLAD 1: SMS Gate API ⭐ (NAJLACNEJŠIE - €0.0275 za SMS)
   * Web: https://www.smsgate.sk
   * API: https://www.smsgate.sk/api
   * Cenník: https://www.smsgate.sk/cennik/
   */
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

  /**
   * PRÍKLAD 2: SMS.sk API
   * Cena: ~€0.03-0.05 za SMS
   */
  private async sendSmsViaSmsSk(phone: string, code: string): Promise<void> {
    const formattedPhone = this.formatPhoneNumber(phone);
    
    // Odstráňte + z telefónneho čísla (SMS.sk potrebuje len čísla)
    const phoneWithoutPlus = formattedPhone.replace('+', '');
    
    try {
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
    } catch (error: any) {
      this.logger.error(`❌ Failed to send SMS via SMS.sk:`, error);
      throw new BadRequestException('Failed to send SMS verification code');
    }
  }

  /**
   * PRÍKLAD 3: MessageBird
   * Cena: ~€0.05-0.10 za SMS
   * Nainštalujte: npm install messagebird
   */
  private async sendSmsViaMessageBird(phone: string, code: string): Promise<void> {
    const formattedPhone = this.formatPhoneNumber(phone);
    
    try {
      const messagebird = require('messagebird')(process.env.MESSAGEBIRD_API_KEY);
      
      await messagebird.messages.create({
        originator: process.env.MESSAGEBIRD_ORIGINATOR || 'PornoPizza',
        recipients: [formattedPhone],
        body: `Your verification code is: ${code}. Valid for 10 minutes.`,
      });
      
      this.logger.log(`✅ SMS verification code sent via MessageBird to ${formattedPhone}`);
    } catch (error: any) {
      this.logger.error(`❌ Failed to send SMS via MessageBird:`, error);
      throw new BadRequestException('Failed to send SMS verification code');
    }
  }

  /**
   * PRÍKLAD 4: Vonage (Nexmo)
   * Cena: ~€0.05 za SMS
   * Nainštalujte: npm install @vonage/server-sdk
   */
  private async sendSmsViaVonage(phone: string, code: string): Promise<void> {
    const formattedPhone = this.formatPhoneNumber(phone);
    
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
      
      this.logger.log(`✅ SMS verification code sent via Vonage to ${formattedPhone}`);
    } catch (error: any) {
      this.logger.error(`❌ Failed to send SMS via Vonage:`, error);
      throw new BadRequestException('Failed to send SMS verification code');
    }
  }

  /**
   * PRÍKLAD 5: Kompletná implementácia s fallback
   * Toto je odporúčaná implementácia - podporuje viacero služieb s fallback
   */
  private async sendSms(phone: string, code: string): Promise<void> {
    const formattedPhone = this.formatPhoneNumber(phone);
    
    // Priorita 1: SMS Gate (najlacnejšie pre Slovensko - €0.0275 za SMS) ⭐
    if (process.env.SMSGATE_API_KEY) {
      try {
        await this.sendSmsViaSmsGate(phone, code);
        return;
      } catch (error) {
        this.logger.warn('SMS Gate failed, trying fallback...');
        // Pokračuj na ďalšiu službu
      }
    }
    
    // Priorita 2: SMS.sk
    if (process.env.SMS_SK_API_KEY) {
      try {
        await this.sendSmsViaSmsSk(phone, code);
        return;
      } catch (error) {
        this.logger.warn('SMS.sk failed, trying fallback...');
        // Pokračuj na ďalšiu službu
      }
    }
    
    // Priorita 3: Twilio (pôvodná implementácia)
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
        this.logger.warn('Twilio failed, trying fallback...');
        // Pokračuj na ďalšiu službu
      }
    }
    
    // Priorita 4: MessageBird
    if (process.env.MESSAGEBIRD_API_KEY) {
      try {
        await this.sendSmsViaMessageBird(phone, code);
        return;
      } catch (error) {
        this.logger.warn('MessageBird failed, trying fallback...');
      }
    }
    
    // Priorita 5: Vonage
    if (process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET) {
      try {
        await this.sendSmsViaVonage(phone, code);
        return;
      } catch (error) {
        this.logger.warn('Vonage failed, trying fallback...');
      }
    }
    
    // Fallback: DEV mode (log do konzoly)
    this.logger.log(`[DEV MODE] SMS Verification Code for ${formattedPhone}: ${code}`);
    this.logger.warn(`⚠️  No SMS provider configured. Code logged above.`);
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    
    if (!cleaned.startsWith('421') && cleaned.length === 9) {
      cleaned = '421' + cleaned;
    }
    
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }
}

/**
 * INŠTALÁCIA BALÍČKOV:
 * 
 * Pre MessageBird:
 * npm install messagebird
 * 
 * Pre Vonage:
 * npm install @vonage/server-sdk
 * 
 * Pre SMS.sk:
 * Nie je potrebný balíček, používa sa fetch() (built-in v Node.js 18+)
 */

/**
 * ENVIRONMENT PREMENNÉ (.env):
 * 
 * # SMS Gate (najlacnejšie pre Slovensko - €0.0275 za SMS) ⭐
 * SMSGATE_API_KEY=your_api_key_here
 * SMSGATE_SENDER=PornoPizza  # Voliteľný identifikátor (max 11 znakov)
 * 
 * # SMS.sk
 * SMS_SK_API_KEY=your_api_key_here
 * SMS_SK_SENDER=PornoPizza
 * 
 * # Twilio
 * TWILIO_ACCOUNT_SID=ACxxxxx
 * TWILIO_AUTH_TOKEN=xxxxx
 * TWILIO_PHONE_NUMBER=+421xxxxx
 * 
 * # MessageBird
 * MESSAGEBIRD_API_KEY=your_api_key_here
 * MESSAGEBIRD_ORIGINATOR=PornoPizza
 * 
 * # Vonage
 * VONAGE_API_KEY=your_api_key_here
 * VONAGE_API_SECRET=your_api_secret_here
 * VONAGE_FROM_NUMBER=+421xxxxx
 */

