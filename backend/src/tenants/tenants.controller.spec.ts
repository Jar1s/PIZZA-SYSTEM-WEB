import { GUARDS_METADATA } from '@nestjs/common/constants';
import { TenantsController } from './tenants.controller';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('TenantsController security metadata', () => {
  const mutationMethods: Array<keyof TenantsController> = [
    'getAllTenants',
    'createTenant',
    'updateTenant',
    'cloneTenant',
    'syncFromMaster',
  ];

  it.each(mutationMethods)('%s is restricted', (methodName) => {
    const handler = TenantsController.prototype[methodName];
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) || [];
    const roles = Reflect.getMetadata('roles', handler) || [];

    expect(guards).toContain(RolesGuard);
    if (methodName === 'getAllTenants') {
      expect(roles).toEqual(['ADMIN', 'OPERATOR']);
    } else {
      expect(roles).toEqual(['ADMIN']);
    }
  });
});
