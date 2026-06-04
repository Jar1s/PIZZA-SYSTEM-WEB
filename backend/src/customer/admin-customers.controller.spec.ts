import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AdminCustomersController } from './admin-customers.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('AdminCustomersController security metadata', () => {
  it('is restricted to admins', () => {
    const classGuards = Reflect.getMetadata(GUARDS_METADATA, AdminCustomersController) || [];
    const classRoles = Reflect.getMetadata('roles', AdminCustomersController) || [];

    expect(classGuards).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
    expect(classRoles).toEqual(['ADMIN']);
  });
});
