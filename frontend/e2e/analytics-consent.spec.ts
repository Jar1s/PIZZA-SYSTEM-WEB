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
