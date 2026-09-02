import { expect, test, type Page } from '@playwright/test';

const PIXEL_ID = '2179689519431618';
const GA_ID = 'G-E2ETEST1';
const ORDER_ID = 'e2e-order-purchase-1';

/**
 * Purchase conversion contract:
 * - never reported without consent,
 * - reported to Meta Pixel (marketing) and GA4 (analytics) after consent,
 * - reported exactly ONCE per order, even across a page reload.
 *
 * Third-party tag scripts are stubbed: the browser gets a fake fbq/gtag that
 * records calls, so nothing leaves the sandbox and assertions are exact.
 */
async function setUpPage(page: Page): Promise<void> {
  await page.route('**/api/tenants/**', async (route) => {
    // Fulfill with copied data, not the live response object – reusing it
    // across navigation raced with its disposal and flaked in CI.
    try {
      const response = await route.fetch();
      const status = response.status();
      const body = await response.json().catch(() => null);
      if (body && typeof body === 'object' && body.theme) {
        body.theme.analyticsConfig = {
          facebookPixel: { enabled: true, pixelId: PIXEL_ID },
          googleAnalytics: { enabled: true, measurementId: GA_ID },
        };
      }
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    } catch {
      await route.continue().catch(() => {});
    }
  });

  // Replace the real tag loaders with recorders. AnalyticsScripts injects
  // inline snippets that define window.fbq / window.gtag; the external
  // fbevents.js / gtag.js downloads are answered with a stub that keeps the
  // recorded queue intact.
  await page.route('**://connect.facebook.net/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* stub */' }),
  );
  await page.route('**://www.googletagmanager.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* stub */' }),
  );

  await page.addInitScript(() => {
    (window as any).__purchaseCalls = { fbq: [] as any[] };
    // Wrap whatever fbq/gtag the inline snippets define, recording each call.
    const wrap = (name: 'fbq' | 'gtag') => {
      let real: any;
      Object.defineProperty(window, name, {
        configurable: true,
        get() {
          return real;
        },
        set(fn: any) {
          real = function (this: unknown, ...args: any[]) {
            (window as any).__purchaseCalls[name].push(args);
            return typeof fn === 'function' ? fn.apply(this, args) : undefined;
          };
          if (fn && typeof fn === 'object') Object.assign(real, fn);
        },
      });
    };
    wrap('fbq');
  });
}

// gtag() is a plain function declaration in the GA snippet that pushes its
// arguments onto window.dataLayer — read the purchase events from there.
const purchaseCalls = (page: Page) =>
  page.evaluate(() => {
    const c = (window as any).__purchaseCalls || { fbq: [] };
    const dl: any[] = (window as any).dataLayer || [];
    return {
      pixel: c.fbq.filter((a: any[]) => a[0] === 'track' && a[1] === 'Purchase'),
      ga: dl
        .map((entry) => Array.from(entry as ArrayLike<any>))
        .filter((a) => a[0] === 'event' && a[1] === 'purchase'),
    };
  });

test.describe('purchase conversion tracking', () => {
  test('does not report a purchase without consent', async ({ page }) => {
    await setUpPage(page);
    await page.goto(`/order/success?orderId=${ORDER_ID}&tenant=pornopizza`);
    await expect(page.getByText('#4242')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(3000);

    const calls = await purchaseCalls(page);
    expect(calls.pixel).toHaveLength(0);
    expect(calls.ga).toHaveLength(0);
  });

  test('reports Purchase to Meta Pixel and GA4 exactly once after consent, even across reload', async ({ page }) => {
    await setUpPage(page);
    await page.goto(`/order/success?orderId=${ORDER_ID}&tenant=pornopizza`);
    await expect(page.getByText('#4242')).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /Prijať všetko|Accept All/ }).click();

    await expect.poll(async () => (await purchaseCalls(page)).pixel.length, { timeout: 10000 }).toBe(1);
    const calls = await purchaseCalls(page);
    expect(calls.pixel[0][2]).toMatchObject({ value: 5, currency: 'EUR', num_items: 2 });
    expect(calls.pixel[0][3]).toMatchObject({ eventID: ORDER_ID });
    expect(calls.ga).toHaveLength(1);
    expect(calls.ga[0][2]).toMatchObject({ transaction_id: ORDER_ID, value: 5, currency: 'EUR' });

    // Reload: consent persists, order is the same — no second purchase.
    await page.reload();
    await expect(page.getByText('#4242')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(3000);
    const after = await purchaseCalls(page);
    expect(after.pixel).toHaveLength(0);
    expect(after.ga).toHaveLength(0);
  });
});
