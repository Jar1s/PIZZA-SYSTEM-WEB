import { expect, test, type Page } from '@playwright/test';

const PIXEL_ID = '2179689519431618';

/**
 * Funnel events (AddToCart → InitiateCheckout → AddPaymentInfo) must reach the
 * pixel only after marketing consent, in order, with sane payloads.
 * (ViewContent needs the customization modal, which the e2e catalog's drink
 * skips — covered by the same helper code path.)
 */
async function setUpPage(page: Page, consent: boolean): Promise<void> {
  await page.route('**/api/tenants/**', async (route) => {
    const response = await route.fetch();
    const body = await response.json().catch(() => null);
    if (body && typeof body === 'object' && body.theme) {
      body.theme.analyticsConfig = { facebookPixel: { enabled: true, pixelId: PIXEL_ID } };
      await route.fulfill({ response, json: body });
      return;
    }
    await route.fulfill({ response });
  });
  await page.route('**://connect.facebook.net/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* stub */' }),
  );
  await page.route('**://nominatim.openstreetmap.org/**', async (route) => {
    const body = route.request().url().includes('limit=1')
      ? JSON.stringify([{ display_name: 'Testovacia 1, Bratislava', lat: '48.1486', lon: '17.1077', address: { road: 'Testovacia', house_number: '1', city: 'Bratislava', postcode: '81101', country_code: 'sk' } }])
      : '[]';
    await route.fulfill({ status: 200, contentType: 'application/json', body });
  });

  await page.addInitScript((granted: boolean) => {
    // Seed consent (both key variants — dev admin auto-login is per-user).
    for (const key of ['cookie_analytics', 'cookie_marketing', 'cookie_analytics_dev-admin', 'cookie_marketing_dev-admin']) {
      window.localStorage.setItem(key, String(granted));
    }
    (window as any).__fbqCalls = [] as any[];
    let real: any;
    Object.defineProperty(window, 'fbq', {
      configurable: true,
      get() {
        return real;
      },
      set(fn: any) {
        real = function (this: unknown, ...args: any[]) {
          (window as any).__fbqCalls.push(args);
          if (args[0] === 'track') {
            try {
              const prev = JSON.parse(window.sessionStorage.getItem('__fbq_snapshot') || '[]');
              prev.push({ event: args[1], payload: args[2] });
              window.sessionStorage.setItem('__fbq_snapshot', JSON.stringify(prev));
            } catch {
              /* ignore */
            }
          }
          return typeof fn === 'function' ? fn.apply(this, args) : undefined;
        };
        if (fn && typeof fn === 'object') Object.assign(real, fn);
      },
    });
  }, consent);
}

const trackedEvents = (page: Page) =>
  page.evaluate(() =>
    ((window as any).__fbqCalls || [])
      .filter((a: any[]) => a[0] === 'track')
      .map((a: any[]) => ({ event: a[1], payload: a[2] })),
  );

async function walkFunnel(page: Page) {
  await page.goto('/?tenant=pornopizza');
  const addButton = page.getByRole('button', { name: 'Pridať' }).first();
  const checkoutButton = page.getByRole('button', { name: 'Pokračovať k platbe' });
  await expect(async () => {
    await addButton.click();
    await expect(checkoutButton).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 60_000 });
  await checkoutButton.click();
  await expect(page.getByRole('heading', { name: 'Pokladňa' })).toBeVisible({ timeout: 90_000 });
  await page.getByPlaceholder('Např. Ján Novák').fill('Jan Tester');
  await page.getByPlaceholder('napr. jan.novak@email.com').fill(`funnel-${Date.now()}@example.com`);
  await page.getByPlaceholder('900 123 456').fill('912345678');
  await page.getByPlaceholder('Zadajte adresu').fill('Testovacia 1');
  await page.locator('label:has-text("Mesto") + input').fill('Bratislava');
  await page.locator('label:has-text("PSČ") + input').fill('81101');
  await expect(page.getByText('Bratislava Test Zone')).toBeVisible({ timeout: 30_000 });
  // Read the recorder BEFORE the cross-origin redirect to the mock gateway
  // (127.0.0.1:3100 has its own sessionStorage).
  const snapshotBeforePay = () =>
    page.evaluate(() => JSON.parse(window.sessionStorage.getItem('__fbq_snapshot') || '[]'));
  await page.getByRole('button', { name: 'Zaplatiť', exact: true }).click();
  // AddPaymentInfo fires synchronously at the start of handlePay; the
  // network round-trips give us time to read before navigation.
  const events = await snapshotBeforePay();
  await page.waitForURL('**/mock-gateway**', { timeout: 90_000 });
  return events;
}

test.describe('pixel funnel events', () => {
  test('sends AddToCart → InitiateCheckout → AddPaymentInfo with consent', async ({ page }) => {
    await setUpPage(page, true);
    const events = await walkFunnel(page);
    const names = events.map((e: any) => e.event);
    expect(names).toContain('AddToCart');
    expect(names).toContain('InitiateCheckout');
    expect(names).toContain('AddPaymentInfo');
    expect(names.indexOf('AddToCart')).toBeLessThan(names.indexOf('InitiateCheckout'));
    expect(names.indexOf('InitiateCheckout')).toBeLessThan(names.indexOf('AddPaymentInfo'));
    const atc = events.find((e: any) => e.event === 'AddToCart');
    expect(atc.payload).toMatchObject({ content_type: 'product', currency: 'EUR' });
    expect(atc.payload.value).toBeGreaterThan(0);
  });

  test('sends nothing without marketing consent', async ({ page }) => {
    await setUpPage(page, false);
    const events = await walkFunnel(page);
    expect(events.filter((e: any) => ['AddToCart', 'InitiateCheckout', 'AddPaymentInfo'].includes(e.event))).toHaveLength(0);
  });
});
