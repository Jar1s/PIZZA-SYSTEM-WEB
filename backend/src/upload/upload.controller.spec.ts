import { GUARDS_METADATA } from '@nestjs/common/constants';
import { UploadController } from './upload.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('UploadController security metadata', () => {
  it('restricts image upload to admins and operators', () => {
    const handler = UploadController.prototype.uploadImage;
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) || [];
    const roles = Reflect.getMetadata('roles', handler) || [];

    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
    expect(roles).toEqual(['ADMIN', 'OPERATOR']);
  });
});
