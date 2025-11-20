import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from './sms.service';
import { PhoneUtil } from '../utils/phone.util';
import { Prisma, User, UserRole } from '@prisma/client';

// Type definitions for user queries
type UserWithPassword = Prisma.UserGetPayload<{
  select: {
    id: true;
    username: true;
    password: true;
    name: true;
    role: true;
    isActive: true;
    phone: true;
    phoneVerified: true;
  };
}>;

type UserWithoutPassword = Omit<UserWithPassword, 'password'>;

export interface LoginDto {
  username: string;
  password: string;
}

export interface RefreshTokenDto {
  refresh_token: string;
}

export interface LoginWithSmsDto {
  username: string;
  password: string;
  phone: string;
  smsCode?: string; // Optional: SMS verification disabled
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private smsService: SmsService,
  ) {}

  async validateUser(username: string, password: string): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        phoneVerified: true,
      },
    });

    if (!user || !user.isActive || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    // Check if SMS verification is needed (only for CUSTOMER role, not for ADMIN/OPERATOR)
    if (user.role === 'CUSTOMER' && (!user.phone || !user.phoneVerified)) {
      return {
        needsSmsVerification: true,
        userId: user.id,
        phoneNumber: user.phone || null,
      };
    }

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    // Generate access token (short-lived: 1h)
    const access_token = this.jwtService.sign(payload);

    // Generate refresh token (long-lived: 7 days)
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Store refresh token in database
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
        username: user.username,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refresh_token } = refreshTokenDto;

    // Find refresh token in database
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refresh_token },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!tokenRecord.user.isActive) {
      throw new UnauthorizedException('User is not active');
    }

    // Generate new access token
    const payload: JwtPayload = {
      userId: tokenRecord.user.id,
      username: tokenRecord.user.username,
      role: tokenRecord.user.role,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: tokenRecord.user.id,
        username: tokenRecord.user.username,
        name: tokenRecord.user.name,
        role: tokenRecord.user.role,
      },
    };
  }

  async logout(refreshToken: string) {
    // Revoke refresh token
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });

    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    // Revoke all refresh tokens for user
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    return { message: 'Logged out from all devices successfully' };
  }

  // Cleanup expired refresh tokens (should be called periodically)
  async cleanupExpiredTokens() {
    const deleted = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true },
        ],
      },
    });

    return { deleted: deleted.count };
  }

  async validateUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        phone: true,
        phoneVerified: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  /**
   * Find user by username
   */
  async findUserByUsername(username: string) {
    return await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        phone: true,
        phoneVerified: true,
        isActive: true,
      },
    });
  }

  /**
   * REMOVED: loginWithSmsVerification
   * This method was removed because it did not actually verify SMS codes.
   * SMS verification is disabled in this system.
   * Use the regular login() method instead.
   */

  /**
   * Update user phone number
   */
  async updateUserPhone(userId: string, phone: string) {
    // Format phone number
    const formatPhoneNumber = (phone: string): string => {
      let cleaned = phone.replace(/\D/g, '');
      if (!cleaned.startsWith('421') && cleaned.length === 9) {
        cleaned = '421' + cleaned;
      }
      if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
      }
      return cleaned;
    };

    const formattedPhone = formatPhoneNumber(phone);

    // Check if phone is already used by another user
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new BadRequestException('Phone number is already in use');
    }

    // Update user phone and mark as unverified
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        phone: formattedPhone,
        phoneVerified: false,
      },
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        phoneVerified: true,
      },
    });

    return {
      message: 'Phone number updated successfully. Please verify it.',
      user,
    };
  }

  /**
   * Mark phone as verified
   */
  async markPhoneAsVerified(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { phoneVerified: true },
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        phoneVerified: true,
      },
    });

    return {
      message: 'Phone number verified successfully',
      user,
    };
  }
}

