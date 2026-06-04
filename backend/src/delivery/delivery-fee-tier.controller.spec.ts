import { GUARDS_METADATA } from '@nestjs/common/constants';
import { DeliveryFeeTierController } from './delivery-fee-tier.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('DeliveryFeeTierController security metadata', () => {
  const adminMethods: Array<keyof DeliveryFeeTierController> = [
    'getAllTiers',
    'createTier',
    'updateTier',
    'deleteTier',
  ];

  it('requires authentication at controller level', () => {
    const classGuards = Reflect.getMetadata(GUARDS_METADATA, DeliveryFeeTierController) || [];

    expect(classGuards).toContain(JwtAuthGuard);
  });

  it.each(adminMethods)('%s is restricted to admins and operators', (methodName) => {
    const handler = DeliveryFeeTierController.prototype[methodName];
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) || [];
    const roles = Reflect.getMetadata('roles', handler) || [];

    expect(guards).toContain(RolesGuard);
    expect(roles).toEqual(['ADMIN', 'OPERATOR']);
  });
});
