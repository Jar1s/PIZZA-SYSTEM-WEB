import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, JwtPayload } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: any) {
    console.log('[JwtStrategy] Validating token with payload:', { userId: payload.userId, email: payload.email, role: payload.role });
    const user = await this.authService.validateUserById(payload.userId);
    if (!user) {
      console.error('[JwtStrategy] User not found or inactive:', payload.userId);
      throw new UnauthorizedException('User not found or inactive');
    }
    console.log('[JwtStrategy] User validated successfully:', { id: user.id, email: user.email, role: user.role });
    return user;
  }
}

