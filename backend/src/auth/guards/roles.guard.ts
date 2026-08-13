import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles as RolesDecorator } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const route = `${request.method} ${request.url}`;
    
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = request;

    if (!user) {
      this.logger.error(`Access denied for ${route}: No user`);
      return false;
    }

    const hasRequiredRole = requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      this.logger.warn(`Access denied for ${route}: user ${user.id} has role ${user.role}, required: ${requiredRoles.join(', ')}`);
    }

    return hasRequiredRole;
  }
}
