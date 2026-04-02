import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate a 6-digit verification code
   */
  private generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Format phone number to E.164 format (e.g., +421912345678)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If it doesn't start with country code, assume Slovak (+421)
    if (!cleaned.startsWith('421') && cleaned.length === 9) {
      cleaned = '421' + cleaned;
    }
    
    // Add + prefix
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Send SMS verification code
   * In development, logs the code instead of sending
   */
  private async sendSms(phone: string, code: string): Promise<void> {
    const formattedPhone = this.formatPhoneNumber(phone);
    
    // If Twilio is not configured, log the code instead of sending SMS
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      // Development mode: Log the code instead of sending SMS
      this.logger.log(`[DEV MODE] SMS Verification Code for ${formattedPhone}: ${code}`);
      return;
    }

    // Check if using Twilio test number (not valid for real SMS)
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    if (twilioPhoneNumber === '+15005550006' || twilioPhoneNumber === '15005550006') {
      // Twilio test number - log code instead
      this.logger.log(`[DEV MODE - Twilio Test Number] SMS Verification Code for ${formattedPhone}: ${code}`);
      this.logger.warn(`Twilio test number (+15005550006) cannot send real SMS. Code logged above.`);
      return;
    }

    // Production mode: Send via Twilio
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

      this.logger.log(`SMS verification code sent to ${formattedPhone}`);
    } catch (error: any) {
      this.logger.error(`Failed to send SMS to ${formattedPhone}:`, error);
      // If error is about invalid phone number, log code instead
      if (error.message && error.message.includes('not a Twilio phone number')) {
        this.logger.warn(`Twilio phone number invalid. Logging code instead: ${code}`);
        this.logger.log(`[DEV MODE] SMS Verification Code for ${formattedPhone}: ${code}`);
        return;
      }
      throw new BadRequestException('Failed to send SMS verification code');
    }
  }

  /**
   * Send verification code to phone number
   * Supports both phone (legacy) and phoneNumber (spec) parameter names
   */
  async sendVerificationCode(phoneOrPhoneNumber: string, userId?: string): Promise<{ success: boolean; message: string }> {
    const phone = phoneOrPhoneNumber;
    const formattedPhone = this.formatPhoneNumber(phone);

    // Rate limiting: Check for recent codes (max 1 per minute per phone)
    const recentCode = await (this.prisma as any).smsVerificationCode.findFirst({
      where: {
        phone: formattedPhone,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // Last 1 minute
        },
        isUsed: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentCode) {
      throw new BadRequestException('Please wait before requesting another code');
    }

    // Generate verification code
    const code = this.generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    // Invalidate previous unused codes for this phone
    await (this.prisma as any).smsVerificationCode.updateMany({
      where: {
        phone: formattedPhone,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      data: { isUsed: true },
    });

    // Create new verification code
    await (this.prisma as any).smsVerificationCode.create({
      data: {
        phone: formattedPhone,
        code,
        expiresAt,
        userId: userId || null,
        attempts: 0,
      },
    });

    // Send SMS
    await this.sendSms(formattedPhone, code);

    return {
      success: true,
      message: 'Verification code sent successfully',
    };
  }

  /**
   * Verify SMS code
   * If userId provided, also updates user's phone and phoneVerified status
   */
  async verifyCode(phone: string, code: string, userId?: string): Promise<{ valid: boolean; userId?: string }> {
    const formattedPhone = this.formatPhoneNumber(phone);

    // Find the most recent unused code for this phone
    const verificationCode = await (this.prisma as any).smsVerificationCode.findFirst({
      where: {
        phone: formattedPhone,
        isUsed: false,
        expiresAt: { gt: new Date() },
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verificationCode) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Check attempt limit (max 5 attempts)
    if (verificationCode.attempts >= 5) {
      await (this.prisma as any).smsVerificationCode.update({
        where: { id: verificationCode.id },
        data: { isUsed: true },
      });
      throw new BadRequestException('Too many verification attempts. Please request a new code.');
    }

    // Increment attempts
    await (this.prisma as any).smsVerificationCode.update({
      where: { id: verificationCode.id },
      data: { attempts: verificationCode.attempts + 1 },
    });

    // Verify code
    if (verificationCode.code !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    // Mark code as used
    await (this.prisma as any).smsVerificationCode.update({
      where: { id: verificationCode.id },
      data: { isUsed: true },
    });

    // If userId provided, update user's phone and mark as verified
    if (userId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          phone: formattedPhone,
          phoneVerified: true,
        } as any,
      });
    }

    return {
      valid: true,
      userId: verificationCode.userId || userId || undefined,
    };
  }

  /**
   * Clean up expired verification codes (should be called periodically)
   */
  async cleanupExpiredCodes(): Promise<{ deleted: number }> {
    const result = await (this.prisma as any).smsVerificationCode.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isUsed: true },
        ],
      },
    });

    return { deleted: result.count };
  }
}

