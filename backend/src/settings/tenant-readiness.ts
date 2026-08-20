/**
 * Brand readiness checklist – the pure classification logic.
 *
 * Turns one tenant's full (server-side) configuration into a list of
 * ✅ / ⚠️ / ❌ checks, so the admin can see at a glance what is still missing
 * before a brand goes live. Kept free of I/O so it is trivially testable;
 * the service supplies the inputs (tenant row, tier count, logo probe).
 */

export type ReadinessStatus = 'ok' | 'warn' | 'fail';

export interface ReadinessCheck {
  key: string;
  label: string;
  status: ReadinessStatus;
  detail: string;
}

export interface ReadinessReport {
  tenantSlug: string;
  tenantName: string;
  /** fail = objednávky nefungujú; warn = funguje s výhradami; ok = pripravené */
  overall: ReadinessStatus;
  checks: ReadinessCheck[];
}

export interface ReadinessInput {
  tenant: {
    slug: string;
    name: string;
    domain: string | null;
    subdomain: string | null;
    isActive: boolean;
    theme: any;
    paymentProvider: string | null;
    paymentConfig: any;
    deliveryConfig: any;
    emailConfig: any;
  };
  /** Active distance-fee tiers applying to this tenant (own or global). */
  deliveryTierCount: number;
  /** Result of probing the logo URL; null when no probe was possible/needed. */
  logoReachable: boolean | null;
}

const asRecord = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {};

export function buildReadinessReport(input: ReadinessInput): ReadinessReport {
  const { tenant, deliveryTierCount, logoReachable } = input;
  const theme = asRecord(tenant.theme);
  const deliveryConfig = asRecord(tenant.deliveryConfig);
  const paymentConfig = asRecord(tenant.paymentConfig);
  const emailConfig = asRecord(tenant.emailConfig);
  const woltConfig = asRecord(deliveryConfig.woltConfig);
  const pickup = asRecord(deliveryConfig.pickupAddress);
  const analytics = asRecord(theme.analyticsConfig);

  const checks: ReadinessCheck[] = [];
  const push = (key: string, label: string, status: ReadinessStatus, detail: string) =>
    checks.push({ key, label, status, detail });

  // --- identity -------------------------------------------------------------
  if (!tenant.isActive) {
    push('active', 'Aktívny brand', 'warn', 'Brand je deaktivovaný – web ani objednávky nefungujú.');
  } else {
    push('active', 'Aktívny brand', 'ok', 'Brand je aktívny.');
  }

  if (!tenant.domain) {
    push('domain', 'Doména', tenant.isActive ? 'warn' : 'ok', 'Brand nemá doménu – je dostupný len interne. Ak je to testovací klon, deaktivuj ho (zdieľa maintenance/otváracie hodiny s ostatnými).');
  } else {
    push('domain', 'Doména', 'ok', tenant.domain);
  }

  const nameLooksTechnical =
    !tenant.name ||
    tenant.name === tenant.slug ||
    tenant.name === tenant.subdomain ||
    tenant.name.includes('.') ||
    tenant.name === tenant.name.toLowerCase();
  push(
    'name',
    'Názov brandu',
    nameLooksTechnical ? 'warn' : 'ok',
    nameLooksTechnical
      ? `„${tenant.name}“ vyzerá ako technický názov – zobrazuje sa v hlavičke webu, e-mailoch a admine.`
      : tenant.name,
  );

  // --- theme ----------------------------------------------------------------
  const logo = typeof theme.logo === 'string' ? theme.logo.trim() : '';
  if (!logo) {
    push('logo', 'Logo', 'warn', 'Logo nie je nastavené – web aj e-maily zobrazujú len názov brandu.');
  } else if (logoReachable === false) {
    push('logo', 'Logo', 'fail', `Logo URL nefunguje (${logo}) – na webe je rozbitý obrázok. Nahraj logo znova.`);
  } else if (/onrender\.com/.test(logo)) {
    push('logo', 'Logo', 'warn', 'Logo mieri na starý hosting (onrender.com) – over, či sa načítava, ideálne ho nahraj znova.');
  } else {
    push('logo', 'Logo', 'ok', logo);
  }

  push(
    'openingHours',
    'Otváracie hodiny',
    theme.openingHours ? 'ok' : 'warn',
    theme.openingHours
      ? 'Nastavené.'
      : 'Nenastavené – objednávky sa riadia hodinami ostatných brandov (zdieľaná kuchyňa).',
  );

  // --- delivery -------------------------------------------------------------
  const hasKitchen =
    typeof pickup.coordinates?.lat === 'number' && typeof pickup.coordinates?.lng === 'number';
  push(
    'kitchen',
    'Kuchyňa (adresa + GPS)',
    hasKitchen ? 'ok' : 'fail',
    hasKitchen
      ? `${pickup.street || ''}, ${pickup.city || ''}`.trim()
      : 'Nenastavená – výpočet dopravy zlyhá a objednávku NIE JE možné vytvoriť.',
  );

  push(
    'deliveryTiers',
    'Cenové pásma dopravy',
    deliveryTierCount > 0 ? 'ok' : 'fail',
    deliveryTierCount > 0
      ? `${deliveryTierCount} aktívnych pásiem.`
      : 'Žiadne pásma – doprava sa nedá naceniť, objednávka zlyhá.',
  );

  const provider = String(deliveryConfig.provider || '').toLowerCase();
  if (provider === 'wolt') {
    const missing = ['apiKey', 'merchantId', 'venueId'].filter((k) => !String(woltConfig[k] || '').trim());
    if (missing.length > 0) {
      push('wolt', 'Wolt Drive', 'warn', `Chýba ${missing.join(', ')} – kuriér sa nedá objednať, zóny sa nekontrolujú.`);
    } else if (/development\.dev\.woltapi/.test(String(woltConfig.apiUrl || ''))) {
      push('wolt', 'Wolt Drive', 'warn', 'TESTOVACIE prostredie – kuriéri sú len simulovaní. Prepni na ostré URL + produkčné kľúče.');
    } else {
      push('wolt', 'Wolt Drive', 'ok', 'Produkčné prostredie, kľúče nastavené. Over „Otestovať zóny“.');
    }
  } else {
    push('wolt', 'Wolt Drive', 'warn', provider ? `Provider: ${provider}.` : 'Rozvoz nie je nastavený – objednávky pôjdu bez kuriéra (vlastný rozvoz).');
  }

  // --- payments -------------------------------------------------------------
  const payProvider = String(tenant.paymentProvider || '').toLowerCase();
  const codEnabled = paymentConfig.cashOnDeliveryEnabled === true || paymentConfig.cardOnDeliveryEnabled === true;
  if (payProvider === 'gopay') {
    const missing = ['clientId', 'clientSecret', 'goId'].filter((k) => !String(paymentConfig[k] || '').trim());
    if (missing.length > 0) {
      push('payment', 'Online platby (GoPay)', codEnabled ? 'warn' : 'fail', `Chýba ${missing.join(', ')} – online platba zlyhá.${codEnabled ? ' Funguje len dobierka.' : ''}`);
    } else if (String(paymentConfig.environment || '').toLowerCase() === 'sandbox') {
      push('payment', 'Online platby (GoPay)', 'warn', 'SANDBOX prostredie – platby sú testovacie.');
    } else {
      push('payment', 'Online platby (GoPay)', 'ok', 'Produkčný GoPay nakonfigurovaný.');
    }
  } else if (payProvider === 'adyen') {
    const missing = ['apiKey', 'merchantAccount'].filter((k) => !String(paymentConfig[k] || '').trim());
    push(
      'payment',
      'Online platby (Adyen)',
      missing.length > 0 ? (codEnabled ? 'warn' : 'fail') : 'ok',
      missing.length > 0
        ? `Chýba ${missing.join(', ')} – online platba zlyhá. Zváž prepnutie na GoPay.${codEnabled ? ' Funguje len dobierka.' : ''}`
        : 'Adyen nakonfigurovaný.',
    );
  } else {
    push('payment', 'Online platby', codEnabled ? 'warn' : 'fail', `Provider „${tenant.paymentProvider || '–'}“ nie je podporovaný.`);
  }

  push(
    'cod',
    'Platba pri doručení',
    codEnabled ? 'ok' : 'warn',
    codEnabled
      ? [paymentConfig.cashOnDeliveryEnabled ? 'hotovosť' : null, paymentConfig.cardOnDeliveryEnabled ? 'karta' : null].filter(Boolean).join(' + ')
      : 'Vypnutá – zákazník musí zaplatiť online.',
  );

  // --- comms / misc ---------------------------------------------------------
  push(
    'email',
    'Odosielací e-mail',
    emailConfig.fromEmail ? 'ok' : 'warn',
    emailConfig.fromEmail
      ? String(emailConfig.fromEmail)
      : 'Nenastavený – e-maily odchádzajú z globálnej schránky (info@p0rnopizza.sk) s menom tohto brandu.',
  );

  push(
    'storyous',
    'Storyous (pokladňa)',
    theme.storyousConfig ? 'ok' : 'warn',
    theme.storyousConfig ? 'Prepojené.' : 'Neprepojené – objednávky sa netlačia na pokladni.',
  );

  const hasAnalytics = Boolean(
    asRecord(analytics.facebookPixel).pixelId || asRecord(analytics.googleAnalytics).measurementId,
  );
  push(
    'analytics',
    'Meranie (Pixel / GA4)',
    hasAnalytics ? 'ok' : 'warn',
    hasAnalytics ? 'Nastavené.' : 'Bez merania – reklama a návštevnosť sa nedajú vyhodnotiť.',
  );

  const overall: ReadinessStatus = checks.some((c) => c.status === 'fail')
    ? 'fail'
    : checks.some((c) => c.status === 'warn')
      ? 'warn'
      : 'ok';

  return { tenantSlug: tenant.slug, tenantName: tenant.name, overall, checks };
}
