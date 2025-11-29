import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Order } from '@prisma/client';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null;

  constructor() {
    // Configure email transporter
    // For development: use Ethereal (fake SMTP) or console logging
    // For production: use real SMTP service (SendGrid, AWS SES, etc.)
    
    if (process.env.SMTP_HOST) {
      // Production SMTP
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else {
      // Development: Create a dummy transporter that won't actually send
      // We'll handle dev mode in the send methods directly
      this.transporter = null as any;
      this.logger.warn('⚠️  Email service in DEV mode - emails will be logged, not sent');
    }
  }

  async sendOrderConfirmation(
    order: Order & { items?: any[] },
    tenantName: string,
    tenantDomain: string,
    currency: string = 'EUR',
  ): Promise<void> {
    const customer = order.customer as any;
    const address = order.address as any;
    
    // Generate tracking URL
    const trackingUrl = `http://${tenantDomain}/order/${order.id}`;
    
    const emailHtml = this.buildOrderConfirmationEmail(
      order,
      customer,
      address,
      tenantName,
      trackingUrl,
      currency,
    );

    try {
      if (process.env.SMTP_HOST && this.transporter) {
        // Production: Actually send the email
        const info = await this.transporter.sendMail({
          from: process.env.EMAIL_FROM || `"${tenantName}" <orders@${tenantDomain}>`,
          to: customer.email,
          subject: `🍕 Objednávka prijatá #${order.id.slice(0, 8).toUpperCase()} - ${tenantName}`,
          html: emailHtml,
        });
        this.logger.log(`✅ Email sent to ${customer.email}: ${info.messageId}`);
      } else {
        // Dev mode: Just log the email content
        this.logger.log(`📧 [DEV MODE] Email would be sent to: ${customer.email}`);
        this.logger.log(`📧 Tracking URL: ${trackingUrl}`);
        console.log('\n📧 EMAIL PREVIEW:\n');
        console.log(`To: ${customer.email}`);
        console.log(`Subject: Objednávka prijatá #${order.id.slice(0, 8).toUpperCase()}`);
        console.log(`Tracking: ${trackingUrl}\n`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${customer.email}:`, error);
      // Don't throw - email failure shouldn't break order creation
    }
  }

  async sendPasswordSetupEmail(
    user: { email: string; name: string },
    passwordResetToken: string,
    tenantName: string,
    tenantDomain: string,
    tenantSlug?: string,
  ): Promise<void> {
    // Use tenant slug in URL if available, otherwise use domain
    const resetUrl = tenantSlug 
      ? `http://${tenantDomain}/auth/set-password?token=${passwordResetToken}&tenant=${tenantSlug}`
      : `http://${tenantDomain}/auth/set-password?token=${passwordResetToken}`;
    
    const emailHtml = this.buildPasswordSetupEmail(
      user,
      resetUrl,
      tenantName,
    );

    try {
      if (process.env.SMTP_HOST && this.transporter) {
        // Production: Actually send the email
        const info = await this.transporter.sendMail({
          from: process.env.EMAIL_FROM || `"${tenantName}" <orders@${tenantDomain}>`,
          to: user.email,
          subject: `🔐 Nastavte si heslo pre váš účet - ${tenantName}`,
          html: emailHtml,
        });
        this.logger.log(`✅ Password setup email sent to ${user.email}: ${info.messageId}`);
      } else {
        // Dev mode: Just log the email content
        this.logger.log(`📧 [DEV MODE] Password setup email would be sent to: ${user.email}`);
        this.logger.log(`📧 Reset URL: ${resetUrl}`);
        console.log('\n📧 PASSWORD SETUP EMAIL PREVIEW:\n');
        console.log(`To: ${user.email}`);
        console.log(`Subject: Nastavte si heslo pre váš účet`);
        console.log(`Reset URL: ${resetUrl}\n`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to send password setup email to ${user.email}:`, error);
      // Don't throw - email failure shouldn't break order creation
    }
  }

  private buildPasswordSetupEmail(
    user: { name: string },
    resetUrl: string,
    tenantName: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nastavte si heslo</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #ff6b35; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🍕 ${tenantName}</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Nastavte si heslo</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <h2 style="color: #333; margin: 0 0 10px 0; font-size: 22px;">Ahoj ${user.name}! 👋</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Váš účet bol úspešne vytvorený! Teraz si prosím nastavte heslo, aby ste sa mohli prihlásiť a sledovať svoje objednávky.
              </p>

              <!-- Setup Password Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background-color: #ff6b35; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                  🔐 Nastaviť heslo
                </a>
              </div>

              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Alebo skopírujte tento odkaz do prehliadača:<br>
                <a href="${resetUrl}" style="color: #ff6b35; text-decoration: none; word-break: break-all;">${resetUrl}</a>
              </p>

              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Dôležité:</strong> Tento odkaz je platný 7 dní. Po nastavení hesla sa budete môcť prihlásiť a sledovať stav svojich objednávok.
                </p>
              </div>

              <!-- Benefits -->
              <h3 style="color: #333; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Výhody vášho účtu</h3>
              <ul style="color: #666; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Sledovanie stavu objednávok v reálnom čase</li>
                <li>História všetkých objednávok</li>
                <li>Rýchlejšie budúce objednávky</li>
                <li>Uložené adresy pre doručenie</li>
              </ul>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
              <p style="color: #999; font-size: 14px; margin: 0;">
                © ${new Date().getFullYear()} ${tenantName}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Format currency amount based on currency code
   * Supports EUR (€), CZK (Kč), USD ($), etc.
   */
  private formatCurrency(amountCents: number, currency: string): string {
    const amount = (amountCents / 100).toFixed(2);
    
    // Currency symbol mapping
    const currencySymbols: Record<string, string> = {
      EUR: '€',
      CZK: 'Kč',
      USD: '$',
      GBP: '£',
      PLN: 'zł',
    };
    
    const symbol = currencySymbols[currency.toUpperCase()] || currency.toUpperCase();
    
    // Some currencies have symbol before, some after
    const symbolBefore = ['EUR', 'USD', 'GBP', 'PLN'].includes(currency.toUpperCase());
    
    return symbolBefore ? `${symbol}${amount}` : `${amount} ${symbol}`;
  }

  private buildOrderConfirmationEmail(
    order: Order,
    customer: any,
    address: any,
    tenantName: string,
    trackingUrl: string,
    currency: string = 'EUR',
  ): string {
    const orderTotal = this.formatCurrency(order.totalCents, currency);
    const orderNumber = order.id.slice(0, 8).toUpperCase();

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Objednávka prijatá</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #ff6b35; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🍕 ${tenantName}</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Objednávka prijatá!</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <h2 style="color: #333; margin: 0 0 10px 0; font-size: 22px;">Ahoj ${customer.name}! 👋</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Ďakujeme za vašu objednávku! Prijali sme ju a už začali pripravovať vašu lahodnú pizzu.
              </p>

              <!-- Order Number -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #ff6b35; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #666; font-size: 14px;">Číslo objednávky</p>
                <p style="margin: 5px 0 0 0; color: #333; font-size: 24px; font-weight: bold;">#${orderNumber}</p>
              </div>

              <!-- Track Order Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${trackingUrl}" style="display: inline-block; background-color: #ff6b35; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                  📦 Sledovať objednávku
                </a>
              </div>

              <!-- Order Details -->
              <h3 style="color: #333; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Súhrn objednávky</h3>
              
              <table width="100%" cellpadding="10" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="color: #666; font-size: 16px;">Medzisúčet</td>
                  <td align="right" style="color: #333; font-size: 16px; font-weight: bold;">${this.formatCurrency(order.subtotalCents, currency)}</td>
                </tr>
                <tr>
                  <td style="color: #666; font-size: 16px;">DPH</td>
                  <td align="right" style="color: #333; font-size: 16px;">${this.formatCurrency(order.taxCents, currency)}</td>
                </tr>
                <tr>
                  <td style="color: #666; font-size: 16px;">Doprava</td>
                  <td align="right" style="color: #333; font-size: 16px;">${this.formatCurrency(order.deliveryFeeCents, currency)}</td>
                </tr>
                <tr style="border-top: 2px solid #f0f0f0;">
                  <td style="color: #333; font-size: 18px; font-weight: bold; padding-top: 15px;">Celkom</td>
                  <td align="right" style="color: #ff6b35; font-size: 20px; font-weight: bold; padding-top: 15px;">${orderTotal}</td>
                </tr>
              </table>

              <!-- Delivery Address -->
              <h3 style="color: #333; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Doručovacia adresa</h3>
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">
                ${address.street}<br>
                ${address.city}, ${address.postalCode}<br>
                ${address.country || 'Slovensko'}
              </p>
              ${address.instructions ? `<p style="color: #999; font-size: 14px; margin: 10px 0 0 0;"><em>Poznámka: ${address.instructions}</em></p>` : ''}

              <!-- Contact -->
              <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #f0f0f0;">
                <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
                  Otázky k objednávke? Odpovedzte na tento e-mail alebo nás kontaktujte na ${customer.phone}
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
              <p style="color: #999; font-size: 14px; margin: 0;">
                Sledujte svoju objednávku kedykoľvek na:<br>
                <a href="${trackingUrl}" style="color: #ff6b35; text-decoration: none; font-weight: bold;">${trackingUrl}</a>
              </p>
              <p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">
                © ${new Date().getFullYear()} ${tenantName}. Všetky práva vyhradené.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  async sendWelcomeEmail(
    user: { email: string; name: string },
    tenantName: string,
    tenantDomain: string,
  ): Promise<void> {
    const emailHtml = this.buildWelcomeEmail(user, tenantName, tenantDomain);

    try {
      if (process.env.SMTP_HOST && this.transporter) {
        // Production: Actually send the email
        const info = await this.transporter.sendMail({
          from: process.env.EMAIL_FROM || `"${tenantName}" <orders@${tenantDomain}>`,
          to: user.email,
          subject: `🎉 Vitajte v ${tenantName}!`,
          html: emailHtml,
        });
        this.logger.log(`✅ Welcome email sent to ${user.email}: ${info.messageId}`);
      } else {
        // Dev mode: Just log the email content
        this.logger.log(`📧 [DEV MODE] Welcome email would be sent to: ${user.email}`);
        console.log('\n📧 WELCOME EMAIL PREVIEW:\n');
        console.log(`To: ${user.email}`);
        console.log(`Subject: 🎉 Vitajte v ${tenantName}!\n`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to send welcome email to ${user.email}:`, error);
      // Don't throw - email failure shouldn't break registration
    }
  }

  private buildWelcomeEmail(
    user: { name: string },
    tenantName: string,
    tenantDomain: string,
  ): string {
    const loginUrl = `http://${tenantDomain}/auth/login`;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vitajte</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #ff6b35; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🍕 ${tenantName}</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Vitajte v našej rodine!</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <h2 style="color: #333; margin: 0 0 10px 0; font-size: 22px;">Ahoj ${user.name}! 👋</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Ďakujeme, že ste sa prihlásili! Váš účet bol úspešne vytvorený a teraz môžete objednávať naše lahodné pizze.
              </p>

              <!-- Login Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" style="display: inline-block; background-color: #ff6b35; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                  🍕 Objednať teraz
                </a>
              </div>

              <!-- Benefits -->
              <h3 style="color: #333; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Čo získate s účtom</h3>
              <ul style="color: #666; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>📦 Sledovanie stavu objednávok v reálnom čase</li>
                <li>📋 História všetkých objednávok</li>
                <li>⚡ Rýchlejšie budúce objednávky</li>
                <li>📍 Uložené adresy pre doručenie</li>
                <li>🎁 Exkluzívne ponuky a zľavy</li>
              </ul>

              <div style="background-color: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 30px 0;">
                <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.6;">
                  <strong>💡 Tip:</strong> Uložte si svoje obľúbené adresy a budúce objednávky budú ešte rýchlejšie!
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
              <p style="color: #999; font-size: 14px; margin: 0;">
                © ${new Date().getFullYear()} ${tenantName}. Všetky práva vyhradené.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}

