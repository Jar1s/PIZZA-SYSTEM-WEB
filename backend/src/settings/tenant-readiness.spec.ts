import { buildReadinessReport } from './tenant-readiness';

const baseTenant = {
  slug: 'pornopizza',
  name: 'PornoPizza',
  domain: 'www.p0rnopizza.sk',
  subdomain: 'p0rnopizza',
  isActive: true,
  theme: {
    logo: '/logos/pornopizza-pink-gradient.png',
    openingHours: { mon: '10-22' },
    storyousConfig: { merchantId: 'm' },
    analyticsConfig: { facebookPixel: { pixelId: '123', enabled: true } },
  },
  paymentProvider: 'gopay',
  paymentConfig: { clientId: 'c', clientSecret: 's', goId: 'g', environment: 'production', cashOnDeliveryEnabled: true },
  deliveryConfig: {
    provider: 'wolt',
    woltConfig: { apiKey: 'k', merchantId: 'm', venueId: 'v', apiUrl: 'https://daas-public-api.wolt.com' },
    pickupAddress: { street: 'Krížna 1', city: 'Bratislava', coordinates: { lat: 48.15, lng: 17.12 } },
  },
  emailConfig: { fromEmail: 'info@p0rnopizza.sk' },
};

const get = (r: ReturnType<typeof buildReadinessReport>, key: string) => r.checks.find((c) => c.key === key)!;

describe('buildReadinessReport', () => {
  it('reports a fully configured production brand as ok', () => {
    const r = buildReadinessReport({ tenant: baseTenant as any, deliveryTierCount: 4, logoReachable: null });
    expect(r.overall).toBe('ok');
    expect(r.checks.every((c) => c.status === 'ok')).toBe(true);
  });

  it('flags the real Pizza v Núdzi state: missing kitchen and unconfigured Adyen are hard fails', () => {
    const r = buildReadinessReport({
      tenant: {
        slug: 'pizzavnudzi-sk', name: 'pizzavnudzi.sk', domain: 'pizzavnudzi.sk', subdomain: 'pizzavnudzi-sk',
        isActive: true, theme: { primaryColor: '#29cf07' }, paymentProvider: 'adyen',
        paymentConfig: { cashOnDeliveryEnabled: true, cardOnDeliveryEnabled: true },
        deliveryConfig: {}, emailConfig: {},
      } as any,
      deliveryTierCount: 4,
      logoReachable: null,
    });
    expect(r.overall).toBe('fail');
    expect(get(r, 'kitchen').status).toBe('fail');
    expect(get(r, 'payment').status).toBe('warn'); // COD enabled softens it
    expect(get(r, 'name').status).toBe('warn');
    expect(get(r, 'logo').status).toBe('warn');
    expect(get(r, 'openingHours').status).toBe('warn');
  });

  it('marks a dead logo URL as fail and a Wolt test environment as warn', () => {
    const r = buildReadinessReport({
      tenant: {
        ...baseTenant,
        theme: { ...baseTenant.theme, logo: 'https://pizza-system-web.onrender.com/api/upload/image/x.png' },
        deliveryConfig: {
          ...baseTenant.deliveryConfig,
          woltConfig: { ...(baseTenant.deliveryConfig as any).woltConfig, apiUrl: 'https://daas-public-api.development.dev.woltapi.com' },
        },
      } as any,
      deliveryTierCount: 4,
      logoReachable: false,
    });
    expect(get(r, 'logo').status).toBe('fail');
    expect(get(r, 'wolt').status).toBe('warn');
    expect(r.overall).toBe('fail');
  });

  it('treats an active tenant without a domain (clone) and zero tiers as problems', () => {
    const r = buildReadinessReport({
      tenant: { ...baseTenant, domain: null, name: 'partypizza Clone' } as any,
      deliveryTierCount: 0,
      logoReachable: null,
    });
    expect(get(r, 'domain').status).toBe('warn');
    expect(get(r, 'deliveryTiers').status).toBe('fail');
  });

  it('gopay sandbox and missing credentials are reported distinctly', () => {
    const sandbox = buildReadinessReport({
      tenant: { ...baseTenant, paymentConfig: { ...baseTenant.paymentConfig, environment: 'sandbox' } } as any,
      deliveryTierCount: 1, logoReachable: null,
    });
    expect(get(sandbox, 'payment').status).toBe('warn');
    expect(get(sandbox, 'payment').detail).toMatch(/SANDBOX/);

    const missing = buildReadinessReport({
      tenant: { ...baseTenant, paymentConfig: { environment: 'production' } } as any,
      deliveryTierCount: 1, logoReachable: null,
    });
    expect(get(missing, 'payment').status).toBe('fail');
    expect(get(missing, 'cod').status).toBe('warn');
  });
});
