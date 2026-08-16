import { expect, test, type Page } from '@playwright/test';

const GA_ID = 'G-E2ETEST1';

/**
 * The measurement scripts must be strictly consent-gated: nothing loads
 * before the visitor accepts, and accepting loads them immediately without
 * a page reload (the cookie-settings event path).
 */
async function setUpPage(page: Page): Promise<void> {
  // No consent seeding here — these tests exercise the banner itself.

  // Inject an analytics config into the tenant theme so the theme-driven
  // loader has something to render.
  await page.route('**/api/tenants/**', async (route) => {
    const response = await route.fetch();
    const body = await response.json().catch(() => null);
    if (body && typeof body === 'object' && body.theme) {
      body.theme.analyticsConfig = {
        googleAnalytics: { enabled: true, measurementId: GA_ID },
      };
      await route.fulfill({ response, json: body });
      return;
    }
    await route.fulfill({ response });
  });

  // Keep CI hermetic — the tag script must never actually download.
  await page.route('**://www.googletagmanager.com/**', (route) => route.abort());
}

test.describe('analytics consent gating', () => {
  test('loads no measurement scripts before consent', async ({ page }) => {
    await setUpPage(page);
    await page.goto('/?tenant=pornopizza');

    await expect(
      page.getByRole('button', { name: /Prijať všetko|Accept All/ }),
    ).toBeVisible({ timeout: 15000 });

    expect(await page.locator('script[src*="googletagmanager.com"]').count()).toBe(0);
    expect(await page.locator('script#google-analytics').count()).toBe(0);
    expect(await page.locator('script#facebook-pixel').count()).toBe(0);
  });

  test('accepting consent loads Google Analytics immediately, without reload', async ({ page }) => {
    await setUpPage(page);
    await page.goto('/?tenant=pornopizza');

    await page.getByRole('button', { name: /Prijať všetko|Accept All/ }).click();

    await expect(page.locator(`script[src*="gtag/js?id=${GA_ID}"]`)).toHaveCount(1, {
      timeout: 10000,
    });
    await expect(page.locator('script#google-analytics')).toHaveCount(1);
  });

  test('rejecting consent keeps scripts out even after reload', async ({ page }) => {
    await setUpPage(page);
    await page.goto('/?tenant=pornopizza');

    await page.getByRole('button', { name: /Odmietnuť|Reject/ }).click();
    await page.waitForTimeout(500);
    expect(await page.locator('script[src*="googletagmanager.com"]').count()).toBe(0);

    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(await page.locator('script[src*="googletagmanager.com"]').count()).toBe(0);
  });
});

test.describe('consent survives account changes', () => {
  test('logging in as admin after consenting keeps the pixel loaded', async ({ page }) => {
    await page.route('**/api/tenants/**', async (route) => {
      const response = await route.fetch();
      const body = await response.json().catch(() => null);
      if (body && typeof body === 'object' && body.theme) {
        body.theme.analyticsConfig = { facebookPixel: { enabled: true, pixelId: '2179689519431618' } };
        await route.fulfill({ response, json: body });
        return;
      }
      await route.fulfill({ response });
    });
    await page.route('**://connect.facebook.net/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* stub */' }),
    );

    await page.goto('/?tenant=pornopizza');
    await page.getByRole('button', { name: /Prijať všetko|Accept All/ }).click();
    await expect(page.locator('script#facebook-pixel')).toHaveCount(1, { timeout: 10000 });

    // Simulate an admin login in this browser (what broke consent before:
    // per-user keys made the freshly logged-in admin a "new" visitor).
    await page.evaluate(() => {
      window.localStorage.setItem('auth_user', JSON.stringify({ id: 'admin-e2e', role: 'ADMIN' }));
      window.localStorage.setItem('auth_token', 'e2e-token');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('script#facebook-pixel')).toHaveCount(1, { timeout: 10000 });
    expect(await page.getByRole('button', { name: /Prijať všetko|Accept All/ }).count()).toBe(0);
  });

  test('migrates a legacy per-user consent forward', async ({ page }) => {
    await page.route('**://connect.facebook.net/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* stub */' }),
    );
    await page.route('**/api/tenants/**', async (route) => {
      const response = await route.fetch();
      const body = await response.json().catch(() => null);
      if (body && typeof body === 'object' && body.theme) {
        body.theme.analyticsConfig = { facebookPixel: { enabled: true, pixelId: '2179689519431618' } };
        await route.fulfill({ response, json: body });
        return;
      }
      await route.fulfill({ response });
    });
    // Old scheme: consent stored only under the user-scoped key.
    await page.addInitScript(() => {
      window.localStorage.setItem('auth_user', JSON.stringify({ id: 'legacy-admin', role: 'ADMIN' }));
      window.localStorage.setItem('cookie_marketing_legacy-admin', 'true');
      window.localStorage.setItem('cookie_analytics_legacy-admin', 'true');
    });
    await page.goto('/?tenant=pornopizza');
    await expect(page.locator('script#facebook-pixel')).toHaveCount(1, { timeout: 10000 });
    expect(await page.evaluate(() => window.localStorage.getItem('cookie_marketing'))).toBe('true');
  });
});
