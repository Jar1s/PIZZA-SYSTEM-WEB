import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from './sms.service';

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CustomerAuthResult {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    phoneVerified?: boolean;
    role: string;
  };
  needsSmsVerification: boolean;
}

@Injectable()
export class CustomerAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private smsService: SmsService,
  ) {}

  /**
   * Register new customer with email and password
   */
  async registerWithEmail(dto: RegisterDto): Promise<CustomerAuthResult> {
    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email } as any,
    });

    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create customer user
    const customer = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: 'CUSTOMER' as any,
        username: dto.email, // Use email as username for compatibility
        phoneVerified: false,
        isActive: true,
      } as any,
    });

    // Generate tokens
    const payload = {
      userId: customer.id,
      email: customer.email,
      role: customer.role,
    };

    const access_token = this.jwtService.sign(payload);
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Clean up expired refresh tokens for this user
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId: customer.id,
        expiresAt: {
          lt: new Date(), // Delete tokens that have already expired
        },
      },
    });

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: customer.id,
        token: refreshToken,
        expiresAt,
      },
    });

    // Check if SMS verification needed
    return {
      access_token,
      refresh_token: refreshToken,
      user: {
        id: customer.id,
        email: customer.email || '',
        name: customer.name,
        role: customer.role,
      },
      needsSmsVerification: false, // SMS verification disabled
    };
  }

  /**
   * Login customer with email and password
   */
  async loginWithEmail(dto: LoginDto): Promise<CustomerAuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email } as any,
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        phone: true,
        phoneVerified: true,
        isActive: true,
      } as any,
    }) as any;

    if (!user || !user.isActive || user.role !== 'CUSTOMER') {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Password not set. Please use OAuth login.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Clean up expired refresh tokens for this user
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        expiresAt: {
          lt: new Date(), // Delete tokens that have already expired
        },
      },
    });

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      access_token,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email || '',
        name: user.name,
        role: user.role,
      },
      needsSmsVerification: false, // SMS verification disabled
    };
  }

  /**
   * Check if email exists
   */
  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email } as any,
    });
    return !!user;
  }

  /**
   * Login or register with Google OAuth
   */
  async loginWithGoogle(idToken: string): Promise<CustomerAuthResult> {
    try {
      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

      // Verify the token
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new BadRequestException('Invalid Google token');
      }

      // Extract user info
      const googleId = payload.sub;
      const email = payload.email;
      
      // Better name fallback: use email prefix if name not provided
      let name = payload.name || payload.given_name;
      if (!name && email) {
        // Extract name from email (e.g., "john.doe@gmail.com" -> "john.doe")
        name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      }
      if (!name) {
        name = 'User'; // Last resort fallback
      }

      if (!email) {
        throw new BadRequestException('Email not provided by Google');
      }

      // Find or create customer
      const customer = await this.findOrCreateCustomer({
        email,
        name,
        googleId,
      });

      return await this.generateAuthResult(customer);
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Google OAuth error: ${error.message}`);
    }
  }

  /**
   * Login or register with Apple OAuth
   * Verifies Apple ID token and extracts user information
   * @param idToken - Apple ID token
   * @param userInfo - User info from Apple (only provided on first login): { name?: { firstName?: string; lastName?: string }; email?: string }
   */
  async loginWithApple(idToken: string, userInfo?: { name?: { firstName?: string; lastName?: string }; email?: string } | null): Promise<CustomerAuthResult> {
    try {
      // Verify the token with Apple's public keys
      // For production, you should fetch Apple's public keys and verify the token
      // For now, we'll decode and verify locally (Apple tokens are signed with ES256)
      
      const clientId = process.env.APPLE_CLIENT_ID || process.env.APPLE_SERVICE_ID;

      // Decode token without verification first to get header
      const decoded = jwt.decode(idToken, { complete: true });
      if (!decoded || typeof decoded === 'string') {
        throw new BadRequestException('Invalid Apple token');
      }

      // In production, you should:
      // 1. Fetch Apple's public keys from https://appleid.apple.com/auth/keys
      // 2. Verify the token signature using the appropriate key
      // 3. Verify the token claims (iss, aud, exp, etc.)
      
      // For now, we'll do basic verification
      // Note: In production, implement proper token verification with Apple's public keys
      const payload = decoded.payload;

      if (!payload || typeof payload === 'string') {
        throw new BadRequestException('Invalid Apple token payload');
      }

      // Verify token is for our app
      const aud = typeof payload.aud === 'string' ? payload.aud : Array.isArray(payload.aud) ? payload.aud[0] : '';
      if (aud !== clientId && aud !== process.env.APPLE_SERVICE_ID) {
        throw new BadRequestException('Token audience mismatch');
      }

      // Verify token issuer
      if (payload.iss !== 'https://appleid.apple.com') {
        throw new BadRequestException('Invalid token issuer');
      }

      // Extract user info
      const appleId = payload.sub; // Apple user ID
      // Email: prefer from userInfo (first login), then from token, then use private relay
      const email = userInfo?.email || (payload as any).email;
      // Name: prefer from userInfo (first login), then construct from email, then default
      let name: string;
      if (userInfo?.name) {
        const firstName = userInfo.name.firstName || '';
        const lastName = userInfo.name.lastName || '';
        name = [firstName, lastName].filter(Boolean).join(' ');
      }
      
      // Better fallback: use email prefix if name not provided
      if (!name && email) {
        // Extract name from email (e.g., "john.doe@privaterelay.appleid.com" -> "john.doe")
        const emailPrefix = email.split('@')[0];
        // Skip private relay emails for name extraction
        if (!email.includes('privaterelay.appleid.com')) {
          name = emailPrefix.replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        }
      }
      
      // Last resort fallback
      if (!name) {
        name = 'User';
      }

      if (!appleId || typeof appleId !== 'string') {
        throw new BadRequestException('Apple ID not provided in token');
      }

      // Find or create customer
      // Note: If email is null, we'll need to handle that (Apple may hide email)
      const customer = await this.findOrCreateCustomer({
        email: email || `${appleId}@privaterelay.appleid.com`, // Use private relay email if email hidden
        name,
        appleId,
      });

      return await this.generateAuthResult(customer);
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Apple OAuth error: ${error.message}`);
    }
  }

  /**
   * Find or create customer (helper for OAuth)
   */
  private async findOrCreateCustomer(data: {
    email: string;
    name: string;
    googleId?: string;
    appleId?: string;
  }): Promise<any> {
    // Try to find existing customer by email or OAuth ID
    // Explicitly select only fields that exist to avoid schema mismatch errors
    let customer = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email } as any,
          ...(data.googleId ? [{ googleId: data.googleId } as any] : []),
          ...(data.appleId ? [{ appleId: data.appleId } as any] : []),
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        googleId: true,
        appleId: true,
        role: true,
        phone: true,
        phoneVerified: true,
        isActive: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    } as any);

    if (customer) {
      // Update OAuth IDs if missing
      const updateData: any = {};
      if (data.googleId && !customer.googleId) {
        updateData.googleId = data.googleId;
      }
      if (data.appleId && !customer.appleId) {
        updateData.appleId = data.appleId;
      }
      if (Object.keys(updateData).length > 0) {
        customer = await this.prisma.user.update({
          where: { id: customer.id },
          data: updateData,
        } as any);
      }
      return customer;
    }

    // Create new customer
    customer = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        googleId: data.googleId,
        appleId: data.appleId,
        role: 'CUSTOMER' as any,
        username: data.email, // Use email as username
        phoneVerified: false,
        isActive: true,
      } as any,
    });

    return customer;
  }

  /**
   * Set password using password reset token (for account setup)
   */
  async setPasswordWithToken(token: string, password: string): Promise<CustomerAuthResult> {
    // Find user by password reset token
    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: token } as any,
    }) as any;

    if (!user) {
      throw new BadRequestException('Neplatný alebo expirovaný token');
    }

    // Check if token is expired
    if (user.passwordResetExpires && new Date() > new Date(user.passwordResetExpires)) {
      throw new BadRequestException('Token expiroval. Požiadajte o nový odkaz na nastavenie hesla.');
    }

    // Check if user already has password
    if (user.password) {
      throw new BadRequestException('Heslo už bolo nastavené. Použite "Zabudnuté heslo" ak ho chcete zmeniť.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with password and clear reset token
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      } as any,
    });

    // Generate auth result (auto-login after password setup)
    return this.generateAuthResult(updatedUser);
  }

  /**
   * Generate auth result (helper)
   */
  private async generateAuthResult(customer: any): Promise<CustomerAuthResult> {
    const payload = {
      userId: customer.id,
      email: customer.email,
      role: customer.role,
    };

    const access_token = this.jwtService.sign(payload);
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Clean up expired refresh tokens for this user
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId: customer.id,
        expiresAt: {
          lt: new Date(), // Delete tokens that have already expired
        },
      },
    });

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: customer.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      access_token,
      refresh_token: refreshToken,
      user: {
        id: customer.id,
        email: customer.email || '',
        name: customer.name,
        phone: customer.phone || undefined,
        phoneVerified: customer.phoneVerified || false,
        role: customer.role,
      },
      needsSmsVerification: false, // SMS verification disabled
    };
  }

  /**
   * Verify SMS code and complete customer registration/login
   */
  async verifySmsAndComplete(phone: string, code: string, userId: string): Promise<CustomerAuthResult> {
    // Verify SMS code (this will update user's phone and phoneVerified)
    const verification = await this.smsService.verifyCode(phone, code, userId);

    if (!verification.valid) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Get updated user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        phoneVerified: true,
      } as any,
    }) as any;

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate new tokens (user is now verified)
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Clean up expired refresh tokens for this user
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        expiresAt: {
          lt: new Date(), // Delete tokens that have already expired
        },
      },
    });

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      access_token,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email || '',
        name: user.name,
        phone: user.phone || undefined,
        phoneVerified: user.phoneVerified || false,
        role: user.role,
      },
      needsSmsVerification: false, // Now verified
    };
  }
}

