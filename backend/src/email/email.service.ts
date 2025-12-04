import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Order } from '@prisma/client';
import { OrderStatus } from '@pizza-ecosystem/shared';

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
      const port = parseInt(process.env.SMTP_PORT || '587');
      const secure = process.env.SMTP_SECURE === 'true';
      
      const smtpConfig: any = {
        host: process.env.SMTP_HOST,
        port: port,
        secure: secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      };

      // For port 587 with STARTTLS, explicitly require TLS
      if (port === 587 && !secure) {
        smtpConfig.requireTLS = true;
        smtpConfig.tls = {
          rejectUnauthorized: false, // Allow self-signed certificates if needed
        };
      }

      // Log SMTP configuration (without password)
      this.logger.log(`📧 SMTP configured: ${smtpConfig.host}:${smtpConfig.port} (secure: ${smtpConfig.secure})`);
      this.logger.log(`📧 SMTP user: ${smtpConfig.auth.user || 'NOT SET'}`);
      this.logger.log(`📧 SMTP password: ${smtpConfig.auth.pass ? '***SET***' : 'NOT SET'}`);
      
      // Additional debugging info
      if (smtpConfig.auth.user) {
        const userHasAt = smtpConfig.auth.user.includes('@');
        const userLength = smtpConfig.auth.user.length;
        this.logger.log(`📧 SMTP user format: ${userHasAt ? '✅ Contains @ (full email)' : '❌ Missing @ (should be full email)'}, length: ${userLength}`);
      }
      if (smtpConfig.auth.pass) {
        const passLength = smtpConfig.auth.pass.length;
        const hasLeadingSpace = smtpConfig.auth.pass.startsWith(' ');
        const hasTrailingSpace = smtpConfig.auth.pass.endsWith(' ');
        this.logger.log(`📧 SMTP password: length: ${passLength}, leading space: ${hasLeadingSpace ? '❌ YES (remove it!)' : '✅ NO'}, trailing space: ${hasTrailingSpace ? '❌ YES (remove it!)' : '✅ NO'}`);
      }

      this.transporter = nodemailer.createTransport(smtpConfig);

      // Verify SMTP connection on startup (non-blocking)
      // Don't block server startup if SMTP verification fails
      this.verifySMTPConnection().catch((error) => {
        this.logger.error('⚠️  SMTP verification failed on startup:', this.formatSMTPError(error));
        this.logger.warn('⚠️  Server will continue, but emails may fail. Check SMTP configuration.');
        // Don't throw - allow server to start even if SMTP is misconfigured
      });
    } else {
      // Development: Create a dummy transporter that won't actually send
      // We'll handle dev mode in the send methods directly
      this.transporter = null as any;
      this.logger.warn('⚠️  Email service in DEV mode - emails will be logged, not sent');
    }
  }

  /**
   * Verify SMTP connection
   */
  private async verifySMTPConnection(): Promise<void> {
    if (!this.transporter) {
      return;
    }

    try {
      await this.transporter.verify();
      this.logger.log('✅ SMTP connection verified successfully');
    } catch (error) {
      this.logger.error('❌ SMTP verification failed:', this.formatSMTPError(error));
      throw error;
    }
  }

  /**
   * Get properly formatted email FROM address
   */
  private getEmailFrom(tenantName: string, tenantDomain: string): string {
    // Log raw inputs for debugging
    this.logger.log(`📧 getEmailFrom called with tenantName: "${tenantName}" (length: ${tenantName.length}), tenantDomain: ${tenantDomain}`);
    this.logger.log(`📧 tenantName char codes: ${Array.from(tenantName).map(c => c.charCodeAt(0)).join(',')}`);
    
    // If EMAIL_FROM is explicitly set, use it (but log it for debugging)
    if (process.env.EMAIL_FROM) {
      this.logger.log(`📧 Using EMAIL_FROM from env: ${process.env.EMAIL_FROM}`);
      return process.env.EMAIL_FROM;
    }

    // Otherwise, use SMTP_USER if available, or fallback to info@domain
    // IMPORTANT: Clean SMTP_USER - remove any spaces, quotes, or invalid characters
    let fromEmail = process.env.SMTP_USER || `info@${tenantDomain}`;
    fromEmail = fromEmail.trim();
    // Strip quotes/angle brackets and collapse whitespace (common misconfigs on Render/Websupport)
    fromEmail = fromEmail.replace(/[\"'<>]/g, '');
    if (fromEmail.includes('@')) {
      const [local, domain] = fromEmail.split('@');
      const cleanLocal = local.replace(/\s+/g, '');
      fromEmail = `${cleanLocal}@${domain.trim()}`;
    }
    
    // Validate that fromEmail is a valid email address
    if (!fromEmail.includes('@')) {
      this.logger.warn(`⚠️ Invalid SMTP_USER format (missing @): ${fromEmail}, using fallback`);
      fromEmail = `info@${tenantDomain}`;
    }
    
    // Format: "Display Name" <email@domain.com>
    // Remove any extra spaces in tenantName and ensure it's clean
    // First, remove any non-printable characters and normalize whitespace
    let cleanTenantName = tenantName.trim();
    // Remove any non-printable characters (keep only printable ASCII + Slovak characters)
    cleanTenantName = cleanTenantName.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    // Normalize multiple spaces to single space
    cleanTenantName = cleanTenantName.replace(/\s+/g, ' ');
    
    // Ensure tenantName doesn't contain quotes or special characters that could break the format
    const safeTenantName = cleanTenantName.replace(/["<>]/g, '');
    
    // Final validation: if tenantName is empty or only spaces, use a default
    const finalTenantName = safeTenantName.trim() || 'Pizza System';
    
    const formattedFrom = `"${finalTenantName}" <${fromEmail}>`;
    this.logger.log(`📧 Generated EMAIL_FROM: ${formattedFrom}`);
    this.logger.log(`📧   - Original tenantName: "${tenantName}" (${tenantName.length} chars)`);
    this.logger.log(`📧   - Cleaned tenantName: "${cleanTenantName}" (${cleanTenantName.length} chars)`);
    this.logger.log(`📧   - Safe tenantName: "${safeTenantName}" (${safeTenantName.length} chars)`);
    this.logger.log(`📧   - Final tenantName: "${finalTenantName}"`);
    this.logger.log(`📧   - fromEmail: ${fromEmail}`);
    
    return formattedFrom;
  }

  /**
   * Format SMTP error messages for better debugging
   */
  private formatSMTPError(error: any): string {
    if (!error) {
      return 'Unknown error';
    }

    const errorMessage = error.message || String(error);
    const errorCode = error.code || '';

    // Authentication errors
    if (errorMessage.includes('authentication failed') || errorMessage.includes('Invalid login') || errorCode === 'EAUTH') {
      return `SMTP Authentication Failed:
  - Check SMTP_USER and SMTP_PASSWORD in environment variables
  - For Websupport: SMTP_USER must be full email (e.g., orders@domain.sk)
  - Verify password is correct (no leading/trailing spaces)
  - Original error: ${errorMessage}`;
    }

    // Connection errors
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ETIMEDOUT') || errorCode === 'ECONNECTION') {
      return `SMTP Connection Failed:
  - Check SMTP_HOST and SMTP_PORT are correct
  - Verify SMTP server is accessible from this network
  - Check firewall settings
  - Original error: ${errorMessage}`;
    }

    // TLS/SSL errors
    if (errorMessage.includes('certificate') || errorMessage.includes('TLS') || errorMessage.includes('SSL')) {
      return `SMTP TLS/SSL Error:
  - Try SMTP_SECURE=false for port 587 (STARTTLS)
  - Try SMTP_SECURE=true for port 465 (SSL)
  - Original error: ${errorMessage}`;
    }

    // Return formatted error
    return `${errorMessage}${errorCode ? ` (code: ${errorCode})` : ''}`;
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
          from: this.getEmailFrom(tenantName, tenantDomain),
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
      const errorMessage = this.formatSMTPError(error);
      this.logger.error(`❌ Failed to send order confirmation email to ${customer.email}`);
      this.logger.error(`   ${errorMessage}`);
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
          from: this.getEmailFrom(tenantName, tenantDomain),
          to: user.email,
          subject: `🔐 Nastavte si heslo pre váš účet - ${tenantName}`,
          html: emailHtml,
        });
        this.logger.log(`✅ Password setup email sent to ${user.email}: ${info.messageId}`);
      } else {
        // Dev mode: Just log the email content
        // Mask token in logs for security
        const maskedUrl = resetUrl.replace(/token=([^&]+)/, 'token=***MASKED***');
        this.logger.log(`📧 [DEV MODE] Password setup email would be sent to: ${user.email}`);
        this.logger.log(`📧 Reset URL: ${maskedUrl}`);
        console.log('\n📧 PASSWORD SETUP EMAIL PREVIEW:\n');
        console.log(`To: ${user.email}`);
        console.log(`Subject: Nastavte si heslo pre váš účet`);
        console.log(`Reset URL: ${maskedUrl}\n`);
      }
    } catch (error) {
      const errorMessage = this.formatSMTPError(error);
      this.logger.error(`❌ Failed to send password setup email to ${user.email}`);
      this.logger.error(`   ${errorMessage}`);
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
                ${order.deliveryFeeCents > 0 ? `
                <tr>
                  <td style="color: #666; font-size: 16px;">Doprava</td>
                  <td align="right" style="color: #333; font-size: 16px;">${this.formatCurrency(order.deliveryFeeCents, currency)}</td>
                </tr>
                ` : ''}
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

  async sendOrderStatusUpdate(
    order: Order & { customer?: any; tenant?: any },
    newStatus: OrderStatus,
    tenantName: string,
    tenantDomain: string,
  ): Promise<void> {
    const customer = order.customer as any;
    if (!customer?.email) {
      return; // No email to send to
    }

    const trackingUrl = `http://${tenantDomain}/order/${order.id}`;
    const orderNumber = order.id.slice(0, 8).toUpperCase();

    // Email notification - len pre statusy kde chceme posielať email
    // PAID a PENDING sa neposielajú (PENDING má confirmation email pri vytvorení objednávky)
    const statusMessages: Partial<Record<OrderStatus, { subject: string; message: string }>> = {
      [OrderStatus.PREPARING]: {
        subject: `👨‍🍳 Objednávka #${orderNumber} je v príprave`,
        message: `Skvelá správa! Vaša objednávka sa teraz pripravuje v našej kuchyni.`,
      },
      [OrderStatus.READY]: {
        subject: `🍕 Objednávka #${orderNumber} je pripravená!`,
        message: `Vaša objednávka je pripravená! Čoskoro bude doručená.`,
      },
      [OrderStatus.OUT_FOR_DELIVERY]: {
        subject: `🚗 Objednávka #${orderNumber} odovzdaná kuriérovi`,
        message: `Vaša objednávka je na ceste! Sledujte doručenie: ${trackingUrl}`,
      },
      [OrderStatus.DELIVERED]: {
        subject: `✅ Objednávka #${orderNumber} doručená`,
        message: `Vaša objednávka bola doručená! Dobrú chuť! 🍕`,
      },
      [OrderStatus.CANCELED]: {
        subject: `❌ Objednávka #${orderNumber} zrušená`,
        message: `Vaša objednávka bola zrušená. Ak máte otázky, kontaktujte nás prosím.`,
      },
      // PAID a PENDING sa neposielajú
    };

    const notification = statusMessages[newStatus];
    if (!notification) {
      return; // No email for this status
    }

    const emailHtml = this.buildStatusUpdateEmail(
      order,
      customer,
      tenantName,
      trackingUrl,
      notification.message,
    );

    try {
      if (process.env.SMTP_HOST && this.transporter) {
        // Production: Actually send the email
        const info = await this.transporter.sendMail({
          from: this.getEmailFrom(tenantName, tenantDomain),
          to: customer.email,
          subject: notification.subject,
          html: emailHtml,
        });
        this.logger.log(`✅ Status update email sent to ${customer.email} for order ${orderNumber}: ${info.messageId}`);
      } else {
        // Dev mode: Just log the email content
        this.logger.log(`📧 [DEV MODE] Status update email would be sent to: ${customer.email}`);
        this.logger.log(`📧 Subject: ${notification.subject}`);
        this.logger.log(`📧 Tracking URL: ${trackingUrl}`);
        console.log('\n📧 STATUS UPDATE EMAIL PREVIEW:\n');
        console.log(`To: ${customer.email}`);
        console.log(`Subject: ${notification.subject}`);
        console.log(`Tracking: ${trackingUrl}\n`);
      }
    } catch (error) {
      const errorMessage = this.formatSMTPError(error);
      this.logger.error(`❌ Failed to send status update email to ${customer.email}`);
      this.logger.error(`   ${errorMessage}`);
      // Don't throw - email failure shouldn't break status update
    }
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
          from: this.getEmailFrom(tenantName, tenantDomain),
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
      const errorMessage = this.formatSMTPError(error);
      this.logger.error(`❌ Failed to send welcome email to ${user.email}`);
      this.logger.error(`   ${errorMessage}`);
      // Don't throw - email failure shouldn't break registration
    }
  }

  private buildStatusUpdateEmail(
    order: Order,
    customer: any,
    tenantName: string,
    trackingUrl: string,
    message: string,
  ): string {
    const orderNumber = order.id.slice(0, 8).toUpperCase();

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aktualizácia stavu objednávky</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px; text-align: center; background-color: #ff6b35;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${tenantName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Aktualizácia stavu objednávky</h2>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Ahoj ${customer.name},
              </p>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                ${message}
              </p>
              <p style="margin: 30px 0; text-align: center;">
                <a href="${trackingUrl}" style="display: inline-block; padding: 12px 30px; background-color: #ff6b35; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Sledovať objednávku
                </a>
              </p>
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                Objednávka #${orderNumber}
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
