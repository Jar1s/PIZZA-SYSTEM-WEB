import { Controller, Post, Body, UseGuards, Request, Res, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import * as crypto from 'crypto';
import { AuthService, LoginDto, RefreshTokenDto } from './auth.service';
import { SmsService } from './sms.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private smsService: SmsService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 login attempts per minute
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    
    // Set HttpOnly cookies in production
    if (process.env.NODE_ENV === 'production') {
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: true, // HTTPS only
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1 hour
        path: '/',
      });
      
      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: true, // HTTPS only
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }
    
    return result;
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 refresh attempts per minute
  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.refreshToken(refreshTokenDto);
    
    // Update HttpOnly cookie in production
    if (process.env.NODE_ENV === 'production') {
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1 hour
        path: '/',
      });
    }
    
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Body() body: { refresh_token?: string }, @Request() req: any, @Res({ passthrough: true }) res: Response) {
    let result;
    
    if (body.refresh_token) {
      result = await this.authService.logout(body.refresh_token);
    } else {
      // If no refresh token provided, logout from all devices
      result = await this.authService.logoutAll(req.user.id);
    }
    
    // Clear HttpOnly cookies in production
    if (process.env.NODE_ENV === 'production') {
      res.clearCookie('access_token', { path: '/' });
      res.clearCookie('refresh_token', { path: '/' });
    }
    
    return result;
  }

  // SMS Verification Endpoints (matching spec)
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 SMS requests per minute
  @Post('send-sms-code')
  async sendSmsCode(@Body() body: { phoneNumber: string; userId: string }) {
    const { phoneNumber, userId } = body;
    return await this.smsService.sendVerificationCode(phoneNumber, userId);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 verification attempts per minute
  @Post('verify-sms')
  async verifySmsCode(@Body() body: { phoneNumber: string; code: string; userId: string }, @Res({ passthrough: true }) res: Response) {
    const { phoneNumber, code, userId } = body;
    
    // Verify SMS code (returns { valid, userId })
    // SMS service will update user's phone and phoneVerified if userId provided
    const verification = await this.smsService.verifyCode(phoneNumber, code, userId);
    
    if (!verification.valid) {
      throw new BadRequestException('Invalid or expired verification code');
    }
    
    // Get user by ID
    const user = await this.authService.validateUserById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    
    // Generate tokens using AuthService's JWT service
    const JwtService = this.authService['jwtService'];
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
    
    const access_token = JwtService.sign(payload);
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Store refresh token
    await this.authService['prisma'].refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });
    
    // Set HttpOnly cookies in production
    if (process.env.NODE_ENV === 'production') {
      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1 hour
        path: '/',
      });
      
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }
    
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

  // Keep old endpoints for backward compatibility
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('sms/send-code')
  async sendSmsCodeLegacy(@Body() body: { phone: string; username?: string }) {
    const { phone, username } = body;
    let userId: string | undefined;
    if (username) {
      const user = await this.authService.findUserByUsername(username);
      if (user) {
        userId = user.id;
      }
    }
    return await this.smsService.sendVerificationCode(phone, userId);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('sms/verify-code')
  async verifySmsCodeLegacy(@Body() body: { phone: string; code: string; username?: string; password?: string }, @Res({ passthrough: true }) res: Response) {
    const { phone, code, username, password } = body;
    const verification = await this.smsService.verifyCode(phone, code);
    
    if (username && password) {
      // Use regular login instead of removed loginWithSmsVerification
      const result = await this.authService.login({
        username,
        password,
      });
      
      if (process.env.NODE_ENV === 'production') {
        res.cookie('access_token', result.access_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 60 * 60 * 1000,
          path: '/',
        });
        
        res.cookie('refresh_token', result.refresh_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/',
        });
      }
      
      return result;
    }
    
    return {
      valid: verification.valid,
      message: 'Code verified successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('sms/update-phone')
  async updatePhone(@Body() body: { phone: string }, @Request() req: any) {
    return await this.authService.updateUserPhone(req.user.id, body.phone);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sms/verify-phone')
  async verifyPhone(@Body() body: { code: string }, @Request() req: any) {
    const user = await this.authService.validateUserById(req.user.id);
    if (!user || !user.phone) {
      throw new Error('User phone not found');
    }
    
    await this.smsService.verifyCode(user.phone, body.code);
    return await this.authService.markPhoneAsVerified(req.user.id);
  }
}

