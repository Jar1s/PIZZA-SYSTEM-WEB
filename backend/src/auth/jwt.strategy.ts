import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, JwtPayload } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private authService: AuthService) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    this.logger.debug('Validating token payload', {
      userId: payload.userId,
      role: payload.role,
    });
    const user = await this.authService.validateUserById(payload.userId);
    if (!user) {
      this.logger.warn('User not found or inactive', { userId: payload.userId });
      throw new UnauthorizedException('User not found or inactive');
    }
    this.logger.debug('User validated successfully', { id: user.id, role: user.role });
    return user;
  }
}
