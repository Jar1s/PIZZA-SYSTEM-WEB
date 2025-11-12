import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
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
      needsSmsVerification: !customer.phone || !customer.phoneVerified,
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
      needsSmsVerification: !user.phone || !user.phoneVerified,
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
      const name = payload.name || payload.given_name || 'Google User';

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
   * Placeholder implementation - needs Apple OAuth library in production
   */
  async loginWithApple(appleToken: string): Promise<CustomerAuthResult> {
    // TODO: Verify Apple token using apple-auth-library
    // For now, this is a placeholder
    // In production, you would:
    // 1. Verify the token with Apple
    // 2. Extract user info (email, name, appleId)
    // 3. Find or create customer
    
    // Placeholder implementation
    throw new BadRequestException('Apple OAuth not yet implemented. Please use email/password login.');
    
    // Example production code:
    // const appleUser = await verifyAppleToken(appleToken);
    // const customer = await this.findOrCreateCustomer({
    //   email: appleUser.email,
    //   name: appleUser.name,
    //   appleId: appleUser.id,
    // });
    // return this.generateAuthResult(customer);
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
    let customer = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email } as any,
          ...(data.googleId ? [{ googleId: data.googleId } as any] : []),
          ...(data.appleId ? [{ appleId: data.appleId } as any] : []),
        ],
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
        role: customer.role,
      },
      needsSmsVerification: !customer.phone || !customer.phoneVerified,
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
      needsSmsVerification: false, // Now verified
    };
  }
}

