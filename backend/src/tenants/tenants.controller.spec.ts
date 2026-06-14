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

describe('TenantsController public redaction', () => {
  function buildController(tenant: any) {
    const tenantsService = {
      getTenantBySlug: jest.fn().mockResolvedValue(tenant),
    } as any;
    return new TenantsController(tenantsService);
  }

  it('strips the Google OAuth client secret from the public tenant payload', async () => {
    const controller = buildController({
      id: 't1',
      slug: 'pornopizza',
      name: 'PornoPizza',
      theme: {
        primaryColor: '#E91E63',
        logo: '/logo.png',
        googleOAuthConfig: {
          clientId: 'public-client-id',
          clientSecret: 'super-secret-do-not-leak',
          redirectUri: 'https://x/callback',
          enabled: true,
        },
      },
      paymentConfig: { provider: 'gopay', clientSecret: 'pay-secret' },
      deliveryConfig: { provider: 'wolt', apiKey: 'wolt-key' },
      emailConfig: { smtpPassword: 'mail-secret' },
    });

    const result: any = await controller.getTenant('pornopizza');

    // Public theme is preserved for rendering...
    expect(result.theme.primaryColor).toBe('#E91E63');
    expect(result.theme.googleOAuthConfig.clientId).toBe('public-client-id');
    expect(result.theme.googleOAuthConfig.enabled).toBe(true);
    // ...but the secret must be gone.
    expect(result.theme.googleOAuthConfig.clientSecret).toBeUndefined();
    // And the other secret-bearing configs stay redacted.
    expect(result.paymentConfig.clientSecret).toBeUndefined();
    expect(result.deliveryConfig.apiKey).toBeUndefined();
    expect(result.emailConfig).toBeUndefined();
  });

  it('handles tenants without a googleOAuthConfig', async () => {
    const controller = buildController({
      id: 't2',
      slug: 'pizzavnudzi',
      name: 'Pizza v Núdzi',
      theme: { primaryColor: '#E63946' },
      paymentConfig: {},
      deliveryConfig: {},
    });

    const result: any = await controller.getTenant('pizzavnudzi');
    expect(result.theme.primaryColor).toBe('#E63946');
    expect(result.theme.googleOAuthConfig).toBeUndefined();
  });
});
