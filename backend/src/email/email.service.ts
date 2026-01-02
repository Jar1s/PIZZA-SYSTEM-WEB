import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Order } from '@prisma/client';
import { OrderStatus, getCustomizationOptions } from '@pizza-ecosystem/shared';
import { PrismaService } from '../prisma/prisma.service';
import { getProductDisplayName } from '../utils/product-name-mapper';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null;
  private tenantTransporters = new Map<string, nodemailer.Transporter>();

  constructor(private prisma: PrismaService) {
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

  private getTenantTransporter(emailConfig?: any): nodemailer.Transporter | null {
    if (emailConfig?.smtpHost) {
      const host = emailConfig.smtpHost;
      const port = parseInt(emailConfig.smtpPort?.toString() || '587', 10);
      const secure =
        emailConfig.smtpSecure === true ||
        emailConfig.smtpSecure === 'true' ||
        false;
      const user = emailConfig.smtpUser;
      const password = emailConfig.smtpPassword;

      const cacheKey = `${host}:${port}:${user || ''}:${secure}`;
      const cached = this.tenantTransporters.get(cacheKey);
      if (cached) {
        return cached;
      }

      const config: any = {
        host,
        port,
        secure,
        auth: user ? { user, pass: password } : undefined,
      };

      if (port === 587 && !secure) {
        config.requireTLS = true;
        config.tls = { rejectUnauthorized: false };
      }

      const transporter = nodemailer.createTransport(config);
      this.tenantTransporters.set(cacheKey, transporter);
      this.logger.log(
        `📧 Using tenant SMTP (${host}:${port}, secure: ${secure}, user: ${user || 'N/A'})`
      );
      return transporter;
    }

    return this.transporter;
  }

  /**
   * Get properly formatted email FROM address
   * Supports tenant-specific email configuration
   */
  private getEmailFrom(tenantName: string, tenantDomain: string, emailConfig?: any): string {
    // Log raw inputs for debugging
    this.logger.log(`📧 getEmailFrom called with tenantName: "${tenantName}" (length: ${tenantName.length}), tenantDomain: ${tenantDomain}`);
    this.logger.log(`📧 tenantName char codes: ${Array.from(tenantName).map(c => c.charCodeAt(0)).join(',')}`);
    
    // Priority 1: Tenant-specific email config
    if (emailConfig?.fromEmail) {
      this.logger.log(`📧 Using tenant-specific fromEmail: ${emailConfig.fromEmail}`);
      const cleanTenantName = this.cleanTenantName(tenantName);
      return `"${cleanTenantName}" <${emailConfig.fromEmail}>`;
    }
    
    // Priority 2: EMAIL_FROM env variable
    if (process.env.EMAIL_FROM) {
      this.logger.log(`📧 Using EMAIL_FROM from env: ${process.env.EMAIL_FROM}`);
      return process.env.EMAIL_FROM;
    }

    // Priority 3: SMTP_USER or fallback to info@domain
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
    const cleanTenantName = this.cleanTenantName(tenantName);
    const formattedFrom = `"${cleanTenantName}" <${fromEmail}>`;
    
    this.logger.log(`📧 Generated EMAIL_FROM: ${formattedFrom}`);
    this.logger.log(`📧   - Cleaned tenantName: "${cleanTenantName}"`);
    this.logger.log(`📧   - fromEmail: ${fromEmail}`);
    
    return formattedFrom;
  }

  /**
   * Clean tenant name for email display
   */
  private cleanTenantName(tenantName: string): string {
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
    return safeTenantName.trim() || 'Pizza System';
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
    tenantTheme?: any,
    emailConfig?: any,
  ): Promise<void> {
    const customer = order.customer as any;
    const address = order.address as any;
    
    // Generate tracking URL - use FRONTEND_URL if available, otherwise fix tenantDomain
    let trackingDomain = process.env.FRONTEND_URL || tenantDomain;
    
    // Remove protocol if present
    trackingDomain = trackingDomain.replace(/^https?:\/\//, '');
    
    // Add www. prefix if missing and not localhost
    if (!trackingDomain.includes('localhost') && !trackingDomain.includes('127.0.0.1')) {
      if (!trackingDomain.startsWith('www.')) {
        trackingDomain = `www.${trackingDomain}`;
      }
    }
    
    // Use https for production, http for localhost
    const protocol = trackingDomain.includes('localhost') || trackingDomain.includes('127.0.0.1') ? 'http' : 'https';
    const trackingUrl = `${protocol}://${trackingDomain}/order/${order.id}`;
    
    this.logger.log(`📧 Generated tracking URL: ${trackingUrl} (from FRONTEND_URL: ${process.env.FRONTEND_URL || 'not set'}, tenantDomain: ${tenantDomain})`);
    
    // Get product images and categories for order items
    const itemsWithImages = await Promise.all(
      (order.items || []).map(async (item: any) => {
        if (item.productId) {
          try {
            const product = await this.prisma.product.findUnique({
              where: { id: item.productId },
              select: { image: true, category: true, displayName: true, name: true } as any, // Type assertion until Prisma client regenerated
            });
            const productDisplayName = (product as any)?.displayName || null;
            this.logger.log('📧 Email: Loaded product displayName', {
              productId: item.productId,
              productName: item.productName,
              productDbName: product?.name,
              productDisplayName,
              willUse: productDisplayName || getProductDisplayName(product?.name || item.productName, 'sk'),
            });
            
            return {
              ...item,
              productImage: product?.image || null,
              productCategory: product?.category || 'PIZZA',
              productDisplayName, // Use DB displayName if available
              productDbName: product?.name || null, // Keep original name for fallback
            };
          } catch (error) {
            this.logger.warn(`Failed to fetch product data for ${item.productId}: ${error}`);
            return { ...item, productImage: null, productCategory: 'PIZZA' };
          }
        }
        return { ...item, productImage: null, productCategory: 'PIZZA' };
      })
    );
    
    // Debug logging for product images
    this.logger.log(`📧 Product images fetched:`, {
      itemsCount: itemsWithImages.length,
      items: itemsWithImages.map((item: any) => ({
        productName: item.productName,
        productId: item.productId,
        productImage: item.productImage,
        hasImage: !!item.productImage,
      })),
    });
    
    const emailHtml = this.buildOrderConfirmationEmail(
      order,
      customer,
      address,
      tenantName,
      trackingUrl,
      currency,
      itemsWithImages,
      tenantTheme,
      tenantDomain,
    );

    const orderNumber = order.orderNumber 
      ? order.orderNumber.toString().padStart(4, '0')
      : order.id.slice(0, 8).toUpperCase(); // Fallback for old orders without orderNumber

    const transporter = this.getTenantTransporter(emailConfig);

    try {
      if (transporter) {
        // Production: Actually send the email
        const info = await transporter.sendMail({
          from: this.getEmailFrom(tenantName, tenantDomain, emailConfig),
          to: customer.email,
          subject: `🍕 Objednávka prijatá #${orderNumber} - ${tenantName}`,
          html: emailHtml,
        });
        this.logger.log(`✅ Email sent to ${customer.email}: ${info.messageId}`);
      } else {
        // Dev mode: Just log the email content
        this.logger.log(`📧 [DEV MODE] Email would be sent to: ${customer.email}`);
        this.logger.log(`📧 Tracking URL: ${trackingUrl}`);
        console.log('\n📧 EMAIL PREVIEW:\n');
        console.log(`To: ${customer.email}`);
        console.log(`Subject: Objednávka prijatá #${orderNumber}`);
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
    tenantTheme?: any,
    emailConfig?: any,
  ): Promise<void> {
    // Generate frontend URL - use FRONTEND_URL if available, otherwise fix tenantDomain
    let frontendDomain = process.env.FRONTEND_URL || tenantDomain;
    
    // Remove protocol if present
    frontendDomain = frontendDomain.replace(/^https?:\/\//, '');
    
    // Add www. prefix if missing and not localhost
    if (!frontendDomain.includes('localhost') && !frontendDomain.includes('127.0.0.1')) {
      if (!frontendDomain.startsWith('www.')) {
        frontendDomain = `www.${frontendDomain}`;
      }
    }
    
    // Use https for production, http for localhost
    const protocol = frontendDomain.includes('localhost') || frontendDomain.includes('127.0.0.1') ? 'http' : 'https';
    const frontendUrl = `${protocol}://${frontendDomain}`;
    
    // Build reset URL with tenant slug if available
    const resetUrl = tenantSlug 
      ? `${frontendUrl}/auth/set-password?token=${passwordResetToken}&tenant=${tenantSlug}`
      : `${frontendUrl}/auth/set-password?token=${passwordResetToken}`;
    
    this.logger.log(`📧 Generated password setup URL: ${resetUrl} (from FRONTEND_URL: ${process.env.FRONTEND_URL || 'not set'}, tenantDomain: ${tenantDomain})`);
    
    const emailHtml = this.buildPasswordSetupEmail(
      user,
      resetUrl,
      tenantName,
      tenantTheme,
    );

    const transporter = this.getTenantTransporter(emailConfig);

    try {
      if (transporter) {
        // Production: Actually send the email
        const info = await transporter.sendMail({
          from: this.getEmailFrom(tenantName, tenantDomain, emailConfig),
          to: user.email,
          subject: `Nastavte si heslo pre váš účet - ${tenantName}`,
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
    tenantTheme?: any,
  ): string {
    // Get theme colors - fallback to brand colors
    const primaryColor = tenantTheme?.primaryColor || '#E91E63';
    
    // Build logo URL - same logic as order confirmation
    let rawAssetBase =
      process.env.FRONTEND_URL ||
      process.env.EMAIL_ASSET_BASE_URL ||
      '';
    
    if (rawAssetBase && !rawAssetBase.includes('localhost') && !rawAssetBase.includes('127.0.0.1')) {
      if (!rawAssetBase.startsWith('http://') && !rawAssetBase.startsWith('https://')) {
        rawAssetBase = `https://${rawAssetBase}`;
      }
      
      const urlObj = new URL(rawAssetBase);
      if (!urlObj.hostname.startsWith('www.') && !urlObj.hostname.includes('localhost') && !urlObj.hostname.includes('127.0.0.1')) {
        urlObj.hostname = `www.${urlObj.hostname}`;
        rawAssetBase = urlObj.toString();
      }
    }
    
    const trimmedBase = rawAssetBase.replace(/\/$/, '');
    const hasProtocol = trimmedBase.startsWith('http://') || trimmedBase.startsWith('https://');
    const isLocal = trimmedBase.includes('localhost') || trimmedBase.includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    const assetBase = hasProtocol ? trimmedBase : trimmedBase ? `${protocol}://${trimmedBase}` : '';
    
    const buildAssetUrl = (path: string | null | undefined) => {
      if (!path || path.trim() === '') return null;
      const cleanPath = path.trim();
      if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        return cleanPath;
      }
      if (!assetBase) return null;
      return `${assetBase}${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
    };
    
    // Build logo URL
    let logoUrl =
      buildAssetUrl(tenantTheme?.logo) ||
      buildAssetUrl('/PORNO PIZZA PINK GRANDIENT.png') ||
      '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nastavte si heslo</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      .email-header {
        padding: 20px 15px !important;
      }
      .logo-img {
        max-width: 150px !important;
      }
      .email-content {
        padding: 30px 20px !important;
      }
      .greeting {
        font-size: 20px !important;
      }
      .greeting-text {
        font-size: 14px !important;
      }
      .setup-button {
        padding: 12px 30px !important;
        font-size: 14px !important;
        display: block !important;
        width: calc(100% - 60px) !important;
        margin: 20px auto !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 10px;">
    <tr>
      <td align="center">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 100%;">
          
          <!-- Header -->
          <tr>
            <td class="email-header" style="background-color: ${primaryColor}; padding: 30px 20px; text-align: center;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${tenantName}" class="logo-img" style="max-width: 200px; height: auto; margin: 0 0 10px 0;" />` : `<h1 style="color: #ffffff; margin: 0; font-size: 28px;">${tenantName}</h1>`}
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Nastavte si heslo</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 40px 30px;">
              
              <h2 class="greeting" style="color: #333; margin: 0 0 10px 0; font-size: 22px;">Ahoj ${user.name}!</h2>
              <p class="greeting-text" style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Váš účet bol úspešne vytvorený. Teraz si prosím nastavte heslo, aby ste sa mohli prihlásiť a sledovať svoje objednávky.
              </p>

              <!-- Setup Password Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="setup-button" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                  Nastaviť heslo
                </a>
              </div>

              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Alebo skopírujte tento odkaz do prehliadača:<br>
                <a href="${resetUrl}" style="color: ${primaryColor}; text-decoration: none; word-break: break-all;">${resetUrl}</a>
              </p>

              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Tento odkaz je platný 7 dní. Po nastavení hesla sa budete môcť prihlásiť a sledovať stav svojich objednávok.
              </p>

              <!-- Benefits -->
              <h3 style="color: #333; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Čo získate s účtom</h3>
              <ul style="color: #666; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Sledovanie stavu objednávok v reálnom čase</li>
                <li>História všetkých objednávok</li>
                <li>Rýchlejšie budúce objednávky</li>
                <li>Uložené adresy pre doručenie</li>
                <li>Exkluzívne ponuky a zľavy</li>
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

  /**
   * Format modifiers for email display
   * Returns array of formatted modifier strings with emojis
   */
  private formatModifiersForEmail(
    modifiers: Record<string, any> | null | undefined,
    productCategory: string = 'PIZZA',
    language: 'sk' | 'en' = 'sk'
  ): string[] {
    if (!modifiers || typeof modifiers !== 'object') {
      return [];
    }

    // Handle string (JSON) - parse it
    let parsedModifiers: Record<string, any>;
    if (typeof modifiers === 'string') {
      try {
        parsedModifiers = JSON.parse(modifiers);
      } catch (error) {
        this.logger.warn('[formatModifiersForEmail] Failed to parse JSON string:', modifiers);
        return [];
      }
    } else {
      parsedModifiers = modifiers;
    }

    if (Object.keys(parsedModifiers).length === 0) {
      return [];
    }

    const formatted: string[] = [];
    const allCustomizations = getCustomizationOptions(productCategory);

    try {
      Object.entries(parsedModifiers).forEach(([categoryId, optionIds]) => {
        const category = allCustomizations.find(c => c.id === categoryId);
        if (!category) {
          return;
        }

        // Handle both array and single value
        const optionIdsArray = Array.isArray(optionIds) 
          ? optionIds 
          : optionIds ? [optionIds] : [];

        if (optionIdsArray.length === 0) return;

        const optionNames = optionIdsArray
          .map((optionId: any) => {
            if (typeof optionId !== 'string') {
              return null;
            }
            const option = category.options.find(o => o.id === optionId);
            if (!option) {
              return null;
            }
            
            // Use full name with emoji for email
            const name = language === 'en' ? option.nameEn : option.name;
            return name;
          })
          .filter(Boolean) as string[];

        if (optionNames.length > 0) {
          const categoryName = language === 'en' ? category.nameEn : category.name;
          formatted.push(`${categoryName}: ${optionNames.join(', ')}`);
        }
      });
    } catch (error) {
      this.logger.error('[formatModifiersForEmail] Error formatting modifiers:', error);
      return [];
    }

    return formatted;
  }

  private buildOrderConfirmationEmail(
    order: Order,
    customer: any,
    address: any,
    tenantName: string,
    trackingUrl: string,
    currency: string = 'EUR',
    itemsWithImages: any[] = [],
    tenantTheme?: any,
    tenantDomain?: string,
  ): string {
    const orderTotal = this.formatCurrency(order.totalCents, currency);
    const orderNumber = order.orderNumber 
      ? order.orderNumber.toString().padStart(4, '0')
      : order.id.slice(0, 8).toUpperCase(); // Fallback for old orders without orderNumber

    // Prefer explicit base for assets (fixes broken images in emails when tenantDomain differs from live frontend)
    // Use FRONTEND_URL first, then EMAIL_ASSET_BASE_URL, then tenantDomain
    let rawAssetBase =
      process.env.FRONTEND_URL ||
      process.env.EMAIL_ASSET_BASE_URL ||
      tenantDomain ||
      '';
    
    // Fix common domain issues: add www. prefix if missing and not localhost
    if (rawAssetBase && !rawAssetBase.includes('localhost') && !rawAssetBase.includes('127.0.0.1')) {
      // If domain doesn't start with http/https, add protocol first
      if (!rawAssetBase.startsWith('http://') && !rawAssetBase.startsWith('https://')) {
        rawAssetBase = `https://${rawAssetBase}`;
      }
      
      // Add www. prefix if missing (for production domains)
      const urlObj = new URL(rawAssetBase);
      if (!urlObj.hostname.startsWith('www.') && !urlObj.hostname.includes('localhost') && !urlObj.hostname.includes('127.0.0.1')) {
        urlObj.hostname = `www.${urlObj.hostname}`;
        rawAssetBase = urlObj.toString();
      }
    }
    
    const trimmedBase = rawAssetBase.replace(/\/$/, '');
    const hasProtocol = trimmedBase.startsWith('http://') || trimmedBase.startsWith('https://');
    const isLocal = trimmedBase.includes('localhost') || trimmedBase.includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    const assetBase = hasProtocol ? trimmedBase : trimmedBase ? `${protocol}://${trimmedBase}` : '';
    
    // Log asset base URL for debugging
    this.logger.log(`📧 Asset base URL: ${assetBase} (from FRONTEND_URL: ${process.env.FRONTEND_URL || 'not set'}, EMAIL_ASSET_BASE_URL: ${process.env.EMAIL_ASSET_BASE_URL || 'not set'}, tenantDomain: ${tenantDomain})`);
    const buildAssetUrl = (path: string | null | undefined) => {
      if (!path || path.trim() === '') return null;
      const cleanPath = path.trim();
      if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        return cleanPath;
      }
      if (!assetBase) return null;
      return `${assetBase}${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
    };
    
    // Get theme colors - fallback to brand colors
    const primaryColor = tenantTheme?.primaryColor || '#E91E63';
    
    // Build logo URL
    let logoUrl =
      buildAssetUrl(tenantTheme?.logo) ||
      buildAssetUrl('/PORNO PIZZA PINK GRANDIENT.png') ||
      '';
    
    // Build image URLs for items and log them
    const itemsWithImageUrls = itemsWithImages.map((item: any) => {
      const imageUrl = buildAssetUrl(item.productImage);
      return { ...item, imageUrl };
    });
    
    // Log generated image URLs
    itemsWithImageUrls.forEach((item: any) => {
      if (item.imageUrl) {
        this.logger.log(`📧 Generated image URL for ${item.productName}: ${item.imageUrl} (from productImage: ${item.productImage || 'null'}, assetBase: ${assetBase})`);
      } else {
        this.logger.log(`📧 No image URL for ${item.productName} (productImage: ${item.productImage || 'null'}, assetBase: ${assetBase || 'not set'})`);
      }
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Objednávka prijatá</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .email-content {
        padding: 20px 15px !important;
      }
      .email-header {
        padding: 12px 15px !important;
      }
      .logo-img {
        max-width: 120px !important;
      }
      .order-number-box {
        padding: 12px !important;
        margin: 15px 0 !important;
      }
      .order-number-label {
        font-size: 12px !important;
      }
      .order-number-value {
        font-size: 20px !important;
      }
      .section-title {
        font-size: 16px !important;
        margin: 20px 0 10px 0 !important;
      }
      .product-table {
        margin-bottom: 15px !important;
      }
      .product-image-cell {
        width: 100% !important;
        display: block !important;
        padding: 10px !important;
        text-align: center !important;
      }
      .product-image {
        width: 100% !important;
        max-width: 200px !important;
        height: auto !important;
        margin: 0 auto !important;
      }
      .product-content-cell {
        display: block !important;
        width: 100% !important;
        padding: 15px !important;
      }
      .product-name {
        font-size: 18px !important;
      }
      .product-quantity {
        font-size: 13px !important;
      }
      .modifiers-box {
        padding: 8px !important;
        margin: 8px 0 !important;
      }
      .modifiers-title {
        font-size: 13px !important;
        margin-bottom: 6px !important;
      }
      .modifier-item {
        font-size: 12px !important;
        line-height: 1.4 !important;
        margin-bottom: 3px !important;
      }
      .product-price {
        font-size: 18px !important;
        margin-top: 10px !important;
      }
      .track-button {
        padding: 12px 30px !important;
        font-size: 14px !important;
        display: block !important;
        width: calc(100% - 60px) !important;
        margin: 20px auto !important;
      }
      .summary-table {
        font-size: 14px !important;
      }
      .summary-total {
        font-size: 18px !important;
        padding-top: 10px !important;
      }
      .address-section {
        font-size: 14px !important;
        line-height: 1.5 !important;
      }
      .greeting {
        font-size: 20px !important;
      }
      .greeting-text {
        font-size: 14px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 10px;">
    <tr>
      <td align="center">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 100%;">
          
          <!-- Header -->
          <tr>
            <td class="email-header" style="background-color: ${primaryColor}; padding: 30px 20px; text-align: center;">
              <img src="${logoUrl}" alt="${tenantName}" class="logo-img" style="max-width: 200px; height: auto; margin-bottom: 10px;" />
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Objednávka prijatá!</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 40px 30px;">
              
              <h2 class="greeting" style="color: #333; margin: 0 0 10px 0; font-size: 22px;">Ahoj ${customer.name}! 👋</h2>
              <p class="greeting-text" style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Ďakujeme za vašu objednávku! Prijali sme ju a už začali pripravovať vašu lahodnú pizzu.
              </p>

              <!-- Order Number -->
              <div class="order-number-box" style="background-color: #f8f9fa; border-left: 4px solid ${primaryColor}; padding: 15px; margin: 20px 0;">
                <p class="order-number-label" style="margin: 0; color: #666; font-size: 14px;">Číslo objednávky</p>
                <p class="order-number-value" style="margin: 5px 0 0 0; color: #333; font-size: 24px; font-weight: bold;">#${orderNumber}</p>
              </div>

              <!-- Order Items with Images -->
              ${itemsWithImageUrls.length > 0 ? `
              <h3 class="section-title" style="color: #333; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Vaša objednávka</h3>
              ${itemsWithImageUrls.map((item: any) => {
                const modifiers = this.formatModifiersForEmail(item.modifiers, item.productCategory || 'PIZZA', 'sk');
                // Use displayName from DB if available, otherwise use static mapping
                const displayName = item.productDisplayName 
                  || getProductDisplayName(item.productDbName || item.productName, 'sk');
                // Debug logging
                this.logger.log(`📧 Formatting modifiers for ${item.productName} (display: ${displayName}):`, {
                  modifiers: item.modifiers,
                  modifiersType: typeof item.modifiers,
                  productCategory: item.productCategory || 'PIZZA',
                  formattedModifiers: modifiers,
                  formattedCount: modifiers.length,
                });
                return `
                <table class="product-table" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                  ${item.imageUrl ? `
                  <tr>
                    <td class="product-image-cell" width="120" style="padding: 10px; vertical-align: top;">
                      <img src="${item.imageUrl}" alt="${displayName}" class="product-image" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px; max-width: 100%;" />
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td class="product-content-cell" style="padding: 15px; vertical-align: top;">
                      <p class="product-name" style="margin: 0 0 5px 0; color: #333; font-size: 16px; font-weight: bold;">${displayName}</p>
                      <p class="product-quantity" style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Množstvo: ${item.quantity}x</p>
                      ${modifiers.length > 0 ? `
                      <div class="modifiers-box" style="margin: 10px 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
                        <p class="modifiers-title" style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: bold;">Detaily objednávky:</p>
                        ${modifiers.map((mod: string) => `
                          <p class="modifier-item" style="margin: 0 0 4px 0; color: #666; font-size: 13px; line-height: 1.5;">• ${mod}</p>
                        `).join('')}
                      </div>
                      ` : ''}
                      <p class="product-price" style="margin: 10px 0 0 0; color: ${primaryColor}; font-size: 16px; font-weight: bold;">${this.formatCurrency(item.priceCents * item.quantity, currency)}</p>
                    </td>
                  </tr>
                </table>
              `;
              }).join('')}
              ` : ''}

              <!-- Track Order Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${trackingUrl}" class="track-button" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                  📦 Sledovať objednávku
                </a>
              </div>

              <!-- Order Details -->
              <h3 class="section-title" style="color: #333; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Súhrn objednávky</h3>
              
              <table class="summary-table" width="100%" cellpadding="10" cellspacing="0" style="margin-bottom: 20px;">
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
                  <td class="summary-total" style="color: #333; font-size: 18px; font-weight: bold; padding-top: 15px;">Celkom s DPH</td>
                  <td align="right" class="summary-total" style="color: ${primaryColor}; font-size: 20px; font-weight: bold; padding-top: 15px;">${orderTotal}</td>
                </tr>
              </table>

              <!-- Delivery Address -->
              <h3 class="section-title" style="color: #333; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Doručovacia adresa</h3>
              <p class="address-section" style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">
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
                <a href="${trackingUrl}" style="color: ${primaryColor}; text-decoration: none; font-weight: bold;">${trackingUrl}</a>
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
    emailConfig?: any,
  ): Promise<void> {
    const customer = order.customer as any;
    if (!customer?.email) {
      return; // No email to send to
    }

    // Generate tracking URL - use FRONTEND_URL if available, otherwise fix tenantDomain
    let trackingDomain = process.env.FRONTEND_URL || tenantDomain;
    
    // Remove protocol if present
    trackingDomain = trackingDomain.replace(/^https?:\/\//, '');
    
    // Add www. prefix if missing and not localhost
    if (!trackingDomain.includes('localhost') && !trackingDomain.includes('127.0.0.1')) {
      if (!trackingDomain.startsWith('www.')) {
        trackingDomain = `www.${trackingDomain}`;
      }
    }
    
    // Use https for production, http for localhost
    const protocol = trackingDomain.includes('localhost') || trackingDomain.includes('127.0.0.1') ? 'http' : 'https';
    const trackingUrl = `${protocol}://${trackingDomain}/order/${order.id}`;
    
    this.logger.log(`📧 Generated tracking URL for status update: ${trackingUrl} (from FRONTEND_URL: ${process.env.FRONTEND_URL || 'not set'}, tenantDomain: ${tenantDomain})`);
    const orderNumber = order.orderNumber 
      ? order.orderNumber.toString().padStart(4, '0')
      : order.id.slice(0, 8).toUpperCase(); // Fallback for old orders without orderNumber

    // Email notification - len pre statusy kde chceme posielať email
    // PAID a PENDING sa neposielajú (PENDING má confirmation email pri vytvorení objednávky)
    const statusMessages: Partial<Record<OrderStatus, { subject: string; message: string }>> = {
      [OrderStatus.PREPARING]: {
        subject: `Objednávka #${orderNumber} je v príprave`,
        message: `Skvelá správa! Vaša objednávka sa teraz pripravuje v našej kuchyni.`,
      },
      [OrderStatus.READY]: {
        subject: `Objednávka #${orderNumber} je pripravená!`,
        message: `Vaša objednávka je pripravená! Čoskoro bude doručená.`,
      },
      [OrderStatus.OUT_FOR_DELIVERY]: {
        subject: `Objednávka #${orderNumber} odovzdaná kuriérovi`,
        message: `Vaša objednávka je na ceste! Sledujte doručenie.`,
      },
      [OrderStatus.DELIVERED]: {
        subject: `Objednávka #${orderNumber} doručená`,
        message: `Vaša objednávka bola doručená! Dobrú chuť!`,
      },
      [OrderStatus.CANCELED]: {
        subject: `Objednávka #${orderNumber} zrušená`,
        message: `Vaša objednávka bola zrušená. Ak máte otázky, kontaktujte nás prosím.`,
      },
      // PAID a PENDING sa neposielajú
    };

    const notification = statusMessages[newStatus];
    if (!notification) {
      return; // No email for this status
    }

    // Get tenant theme from order.tenant
    const tenantTheme = (order.tenant as any)?.theme || {};

    const emailHtml = this.buildStatusUpdateEmail(
      order,
      customer,
      tenantName,
      trackingUrl,
      notification.message,
      tenantTheme,
      tenantDomain,
    );

    const transporter = this.getTenantTransporter(emailConfig);

    try {
      if (transporter) {
        // Production: Actually send the email
        const info = await transporter.sendMail({
          from: this.getEmailFrom(tenantName, tenantDomain, emailConfig),
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
    tenantTheme?: any,
    tenantSlug?: string,
    emailConfig?: any,
  ): Promise<void> {
    const emailHtml = this.buildWelcomeEmail(user, tenantName, tenantDomain, tenantTheme, tenantSlug);
    const emailFrom = this.getEmailFrom(tenantName, tenantDomain, emailConfig);
    const emailSubject = `🎉 Vitajte v ${tenantName}!`;
    const transporter = this.getTenantTransporter(emailConfig);

    try {
      if (transporter) {
        // Verify SMTP connection before sending
        try {
          await transporter.verify();
          this.logger.log(`✅ SMTP connection verified before sending welcome email`);
        } catch (verifyError) {
          this.logger.error(`❌ SMTP verification failed before sending welcome email:`, this.formatSMTPError(verifyError));
          // Continue anyway - sometimes verify fails but sendMail works
        }

        // Log email details before sending
        this.logger.log(`📧 Sending welcome email:`);
        this.logger.log(`   From: ${emailFrom}`);
        this.logger.log(`   To: ${user.email}`);
        this.logger.log(`   Subject: ${emailSubject}`);

        // Production: Actually send the email
        const info = await transporter.sendMail({
          from: emailFrom,
          to: user.email,
          subject: emailSubject,
          html: emailHtml,
        });

        // Log detailed response
        this.logger.log(`✅ Welcome email sent to ${user.email}`);
        this.logger.log(`   MessageId: ${info.messageId || 'N/A'}`);
        this.logger.log(`   Response: ${info.response || 'N/A'}`);
        if (info.accepted && info.accepted.length > 0) {
          this.logger.log(`   Accepted: ${info.accepted.join(', ')}`);
        }
        if (info.rejected && info.rejected.length > 0) {
          this.logger.warn(`   ⚠️ Rejected: ${info.rejected.join(', ')}`);
        }
        if (info.pending && info.pending.length > 0) {
          this.logger.log(`   Pending: ${info.pending.join(', ')}`);
        }
      } else {
        // Dev mode: Just log the email content
        this.logger.log(`📧 [DEV MODE] Welcome email would be sent to: ${user.email}`);
        console.log('\n📧 WELCOME EMAIL PREVIEW:\n');
        console.log(`From: ${emailFrom}`);
        console.log(`To: ${user.email}`);
        console.log(`Subject: ${emailSubject}\n`);
      }
    } catch (error) {
      const errorMessage = this.formatSMTPError(error);
      this.logger.error(`❌ Failed to send welcome email to ${user.email}`);
      this.logger.error(`   From: ${emailFrom}`);
      this.logger.error(`   Subject: ${emailSubject}`);
      this.logger.error(`   Error: ${errorMessage}`);
      // Log full error for debugging
      if (error instanceof Error) {
        this.logger.error(`   Stack: ${error.stack}`);
      }
      // Don't throw - email failure shouldn't break registration
    }
  }

  private buildStatusUpdateEmail(
    order: Order,
    customer: any,
    tenantName: string,
    trackingUrl: string,
    message: string,
    tenantTheme?: any,
    tenantDomain?: string,
  ): string {
    const orderNumber = order.orderNumber 
      ? order.orderNumber.toString().padStart(4, '0')
      : order.id.slice(0, 8).toUpperCase(); // Fallback for old orders without orderNumber

    // Get theme colors - fallback to brand colors
    const primaryColor = tenantTheme?.primaryColor || '#FF6B00';
    
    // Build asset base URL for logo
    let rawAssetBase =
      process.env.FRONTEND_URL ||
      process.env.EMAIL_ASSET_BASE_URL ||
      tenantDomain ||
      '';
    
    // Fix common domain issues: add www. prefix if missing and not localhost
    if (rawAssetBase && !rawAssetBase.includes('localhost') && !rawAssetBase.includes('127.0.0.1')) {
      if (!rawAssetBase.startsWith('http://') && !rawAssetBase.startsWith('https://')) {
        rawAssetBase = `https://${rawAssetBase}`;
      }
      
      const urlObj = new URL(rawAssetBase);
      if (!urlObj.hostname.startsWith('www.') && !urlObj.hostname.includes('localhost') && !urlObj.hostname.includes('127.0.0.1')) {
        urlObj.hostname = `www.${urlObj.hostname}`;
        rawAssetBase = urlObj.toString();
      }
    }
    
    const trimmedBase = rawAssetBase.replace(/\/$/, '');
    const hasProtocol = trimmedBase.startsWith('http://') || trimmedBase.startsWith('https://');
    const isLocal = trimmedBase.includes('localhost') || trimmedBase.includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    const assetBase = hasProtocol ? trimmedBase : trimmedBase ? `${protocol}://${trimmedBase}` : '';
    
    const buildAssetUrl = (path: string | null | undefined) => {
      if (!path || path.trim() === '') return null;
      const cleanPath = path.trim();
      if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        return cleanPath;
      }
      if (!assetBase) return null;
      return `${assetBase}${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
    };
    
    // Build logo URL
    let logoUrl =
      buildAssetUrl(tenantTheme?.logo) ||
      buildAssetUrl('/PORNO PIZZA PINK GRANDIENT.png') ||
      '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aktualizácia stavu objednávky</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .email-content {
        padding: 20px 15px !important;
      }
      .email-header {
        padding: 20px 15px !important;
      }
      .logo-img {
        max-width: 150px !important;
      }
      .track-button {
        padding: 12px 30px !important;
        font-size: 14px !important;
        display: block !important;
        width: calc(100% - 60px) !important;
        margin: 20px auto !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 10px;">
    <tr>
      <td align="center">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 100%;">
          
          <!-- Header -->
          <tr>
            <td class="email-header" style="background-color: ${primaryColor}; padding: 30px 20px; text-align: center;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${tenantName}" class="logo-img" style="max-width: 200px; height: auto; margin: 0 0 10px 0;" />` : `<h1 style="color: #ffffff; margin: 0; font-size: 28px;">${tenantName}</h1>`}
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Aktualizácia stavu objednávky</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 40px 30px;">
              
              <h2 class="greeting" style="color: #333; margin: 0 0 10px 0; font-size: 22px;">Ahoj ${customer.name}!</h2>
              <p class="greeting-text" style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                ${message}
              </p>

              <!-- Track Order Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${trackingUrl}" class="track-button" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                  Sledovať objednávku
                </a>
              </div>

              <!-- Order Number -->
              <div class="order-number-box" style="background-color: #f8f9fa; border-left: 4px solid ${primaryColor}; padding: 15px; margin: 20px 0;">
                <p class="order-number-label" style="margin: 0; color: #666; font-size: 14px;">Číslo objednávky</p>
                <p class="order-number-value" style="margin: 5px 0 0 0; color: #333; font-size: 24px; font-weight: bold;">#${orderNumber}</p>
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

  private buildWelcomeEmail(
    user: { name: string },
    tenantName: string,
    tenantDomain: string,
    tenantTheme?: any,
    tenantSlug?: string,
  ): string {
    // Build frontend URL - use FRONTEND_URL if available, otherwise construct from tenantDomain
    let frontendUrl = process.env.FRONTEND_URL || '';
    
    if (!frontendUrl) {
      // Remove protocol if present
      let domain = tenantDomain.replace(/^https?:\/\//, '');
      
      // Add www. prefix if missing and not localhost
      if (!domain.includes('localhost') && !domain.includes('127.0.0.1')) {
        if (!domain.startsWith('www.')) {
          domain = `www.${domain}`;
        }
      }
      
      // Use https for production, http for localhost
      const protocol = domain.includes('localhost') || domain.includes('127.0.0.1') ? 'http' : 'https';
      frontendUrl = `${protocol}://${domain}`;
    }
    
    // Build order URL with tenant parameter
    const orderUrl = tenantSlug 
      ? `${frontendUrl}?tenant=${tenantSlug}`
      : frontendUrl;
    
    // Get theme colors - fallback to brand colors
    const primaryColor = tenantTheme?.primaryColor || '#FF6B00';
    
    // Build asset base URL for logo
    let rawAssetBase =
      process.env.FRONTEND_URL ||
      process.env.EMAIL_ASSET_BASE_URL ||
      tenantDomain ||
      '';
    
    // Fix common domain issues: add www. prefix if missing and not localhost
    if (rawAssetBase && !rawAssetBase.includes('localhost') && !rawAssetBase.includes('127.0.0.1')) {
      if (!rawAssetBase.startsWith('http://') && !rawAssetBase.startsWith('https://')) {
        rawAssetBase = `https://${rawAssetBase}`;
      }
      
      const urlObj = new URL(rawAssetBase);
      if (!urlObj.hostname.startsWith('www.') && !urlObj.hostname.includes('localhost') && !urlObj.hostname.includes('127.0.0.1')) {
        urlObj.hostname = `www.${urlObj.hostname}`;
        rawAssetBase = urlObj.toString();
      }
    }
    
    const trimmedBase = rawAssetBase.replace(/\/$/, '');
    const hasProtocol = trimmedBase.startsWith('http://') || trimmedBase.startsWith('https://');
    const isLocal = trimmedBase.includes('localhost') || trimmedBase.includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    const assetBase = hasProtocol ? trimmedBase : trimmedBase ? `${protocol}://${trimmedBase}` : '';
    
    const buildAssetUrl = (path: string | null | undefined) => {
      if (!path || path.trim() === '') return null;
      const cleanPath = path.trim();
      if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        return cleanPath;
      }
      if (!assetBase) return null;
      return `${assetBase}${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
    };
    
    // Build logo URL - try multiple paths
    let logoUrl =
      buildAssetUrl(tenantTheme?.logo) ||
      buildAssetUrl('/logos/pornopizza.svg') ||
      buildAssetUrl('/logo-pornopizza.svg') ||
      buildAssetUrl('/PORNO PIZZA PINK GRANDIENT.png') ||
      '';
    
    // Create gradient color (darker shade for gradient effect)
    const gradientColor = primaryColor; // Can be enhanced later
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vitajte</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .email-content {
        padding: 20px 15px !important;
      }
      .email-header {
        padding: 20px 15px !important;
      }
      .logo-img {
        max-width: 150px !important;
      }
      .welcome-button {
        padding: 12px 30px !important;
        font-size: 14px !important;
        display: block !important;
        width: calc(100% - 60px) !important;
        margin: 20px auto !important;
      }
      .section-title {
        font-size: 16px !important;
        margin: 20px 0 10px 0 !important;
      }
      .benefits-list {
        font-size: 14px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 10px;">
    <tr>
      <td align="center">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 100%;">
          
          <!-- Header -->
          <tr>
            <td class="email-header" style="background-color: ${primaryColor}; padding: 30px 20px; text-align: center;">
              ${logoUrl ? `
              <img src="${logoUrl}" alt="${tenantName}" class="logo-img" style="max-width: 200px; height: auto; margin-bottom: 10px;" />
              ` : `
              <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 28px;">🍕 ${tenantName}</h1>
              `}
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Vitajte v našej rodine!</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 40px 30px;">
              
              <h2 class="greeting" style="color: #333; margin: 0 0 10px 0; font-size: 22px;">Ahoj ${user.name}! 👋</h2>
              <p class="greeting-text" style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Ďakujeme, že ste sa prihlásili! Váš účet bol úspešne vytvorený a teraz môžete objednávať naše lahodné pizze.
              </p>

              <!-- Order Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${orderUrl}" class="welcome-button" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                  🍕 Objednať teraz
                </a>
              </div>

              <!-- Benefits -->
              <h3 class="section-title" style="color: #333; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Čo získate s účtom</h3>
              <ul class="benefits-list" style="color: #666; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>📦 Sledovanie stavu objednávok v reálnom čase</li>
                <li>📋 História všetkých objednávok</li>
                <li>⚡ Rýchlejšie budúce objednávky</li>
                <li>📍 Uložené adresy pre doručenie</li>
                <li>🎁 Exkluzívne ponuky a zľavy</li>
              </ul>

              <div style="background-color: #e7f3ff; border-left: 4px solid ${primaryColor}; padding: 15px; margin: 30px 0;">
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
