import { Controller, Post, Body, UseGuards, Request, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthService, LoginDto, RefreshTokenDto } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
}

