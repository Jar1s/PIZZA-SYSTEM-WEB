import { expect, test, type Page } from '@playwright/test';

const mockApiPort = Number(process.env.PLAYWRIGHT_MOCK_API_PORT || 3100);
const mockApiUrl = `http://127.0.0.1:${mockApiPort}`;

const PRODUCT_NAME = 'Testovacia Limonada';
const PRODUCT_ID = 'e2e-drink-1';

// Deterministic Nominatim geocoding answer for a Bratislava address so the
// checkout address validation never talks to the real OpenStreetMap API and
// never opens a confirm() dialog about an unverifiable address.
const nominatimBratislavaResult = [
  {
    display_name: 'Testovacia 1, Bratislava, Slovensko',
    lat: '48.1486',
    lon: '17.1077',
    address: {
      road: 'Testovacia',
      house_number: '1',
      city: 'Bratislava',
      state: 'Bratislavský kraj',
      postcode: '81101',
      country: 'Slovensko',
      country_code: 'sk',
    },
  },
];

/**
 * Shared page setup:
 * - dismisses the cookie-consent banner before the app boots,
 * - stubs Nominatim (validation calls use limit=1 and get a Bratislava match;
 *   the street autocomplete gets an empty list so no suggestion dropdown
 *   covers the form),
 * - records any window.alert/confirm dialogs — the checkout resilience change
 *   must never use them.
 */
async function setUpPage(page: Page): Promise<string[]> {
  const dialogs: string[] = [];

  await page.addInitScript(() => {
    // The consent hook keys the choice per user; in dev the admin AuthContext
    // auto-logs-in a "dev-admin" fallback user, so seed both key variants.
    for (const key of [
      'cookie_analytics',
      'cookie_marketing',
      'cookie_analytics_dev-admin',
      'cookie_marketing_dev-admin',
    ]) {
      window.localStorage.setItem(key, 'false');
    }
  });

  // Address autocomplete (Photon) – keep the spec offline-deterministic.
  await page.route('**://photon.komoot.io/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ features: [] }) });
  });

  await page.route('**://nominatim.openstreetmap.org/**', async (route) => {
    const body = route.request().url().includes('limit=1')
      ? JSON.stringify(nominatimBratislavaResult)
      : '[]';
    await route.fulfill({ status: 200, contentType: 'application/json', body });
  });

  page.on('dialog', (dialog) => {
    dialogs.push(`${dialog.type()}: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });

  return dialogs;
}

/** Home -> add the seeded product to the cart -> cart sidebar -> /checkout. */
async function addProductAndOpenCheckout(page: Page) {
  await page.goto('/?tenant=pornopizza', { timeout: 120_000, waitUntil: 'domcontentloaded' });

  const drinkCard = page.locator('div').filter({ hasText: 'Testovacia Limonada' }).filter({ has: page.getByRole('button', { name: 'Pridať' }) }).last();
  const addButton = drinkCard.getByRole('button', { name: 'Pridať' }).first();
  await expect(addButton).toBeVisible({ timeout: 90_000 });

  // On a cold dev server the first click can land before React hydration and
  // be silently dropped. Adding to the cart opens the cart sidebar in the same
  // state update, so retry the click until the sidebar's checkout button shows.
  const checkoutButton = page.getByRole('button', { name: 'Pokračovať k platbe' });
  await expect(async () => {
    await addButton.click();
    await expect(checkoutButton).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 90_000 });
  await checkoutButton.click();

  await expect(page.getByRole('heading', { name: 'Pokladňa' })).toBeVisible({ timeout: 90_000 });
  await expect(page.getByText(`${PRODUCT_NAME} x 1`)).toBeVisible();
}

/** Fills the guest contact + delivery address form with a valid Bratislava address. */
async function fillGuestCheckoutForm(page: Page, email: string) {
  await page.getByPlaceholder('Např. Ján Novák').fill('Jan Tester');
  await page.getByPlaceholder('napr. jan.novak@email.com').fill(email);
  await page.getByPlaceholder('900 123 456').fill('912345678');
  await page.getByPlaceholder('Zadajte adresu').fill('Testovacia 1');
  await page.locator('label:has-text("Mesto") + input').fill('Bratislava');
  await page.locator('label:has-text("PSČ") + input').fill('81101');

  // The compact summary above the pay button renders its Doprava row once the
  // mocked calculate-fee call settled (the zone name is no longer shown).
  await expect(page.getByText('Doprava:')).toBeVisible({ timeout: 15_000 });
}

async function readCartItems(page: Page): Promise<unknown[]> {
  return page.evaluate(() => {
    const raw = window.localStorage.getItem('cart-storage');
    if (!raw) return [];
    try {
      return JSON.parse(raw)?.state?.items ?? [];
    } catch {
      return [];
    }
  });
}

test.describe('checkout flow', () => {
  test.setTimeout(240_000);

  test('guest checkout happy path creates the order and redirects to the payment gateway', async ({ page, request }) => {
    const email = `happy-${Date.now()}@example.com`;
    const dialogs = await setUpPage(page);

    await addProductAndOpenCheckout(page);
    await fillGuestCheckoutForm(page, email);

    await page.getByRole('button', { name: 'Zaplatiť', exact: true }).click();

    // Success path: cart cleared and browser navigated to the mocked redirectUrl.
    await page.waitForURL('**/mock-gateway**', { timeout: 90_000 });
    await expect(page.getByRole('heading', { name: 'Mock Payment Gateway' })).toBeVisible();

    // The mock API must have received the order POST for this guest.
    const ordersResponse = await request.get(`${mockApiUrl}/__mock__/orders`);
    expect(ordersResponse.ok()).toBe(true);
    const orders = (await ordersResponse.json()) as Array<Record<string, any>>;
    const order = orders.find((entry) => entry.customer?.email === email);
    expect(order).toBeTruthy();
    expect(order?.clientRequestId).toBeTruthy();
    expect(order?.items).toHaveLength(1);
    expect(order?.items?.[0]).toMatchObject({ productId: PRODUCT_ID, quantity: 1 });
    expect(order?.address).toMatchObject({ city: 'Bratislava', postalCode: '81101' });

    // Back on the storefront origin the cart must be empty (it was cleared
    // right before the redirect).
    await page.goto('/?tenant=pornopizza', { timeout: 120_000, waitUntil: 'domcontentloaded' });
    expect(await readCartItems(page)).toHaveLength(0);

    // The whole flow must not use blocking window.alert/confirm dialogs.
    expect(dialogs).toEqual([]);
  });

  test('payment-session failure shows an inline alert, stays on /checkout and keeps the cart', async ({ page, request }) => {
    const email = `fail-${Date.now()}@example.com`;
    const dialogs = await setUpPage(page);

    await addProductAndOpenCheckout(page);
    await fillGuestCheckoutForm(page, email);

    // Only the payment-session endpoint fails; order creation still succeeds.
    await page.route('**/api/payments/session', async (route) => {
      const origin = route.request().headers()['origin'];
      const corsHeaders: Record<string, string> = origin
        ? { 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true' }
        : {};
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({
          status: 204,
          headers: {
            ...corsHeaders,
            'access-control-allow-methods': 'POST,OPTIONS',
            'access-control-allow-headers': 'content-type, authorization',
          },
        });
        return;
      }
      await route.fulfill({
        status: 500,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Mock payment gateway failure' }),
      });
    });

    await page.getByRole('button', { name: 'Zaplatiť', exact: true }).click();

    // Inline role="alert" error appears instead of a redirect or window.alert.
    // (Filter by text: Next.js adds its own empty role="alert" route announcer.)
    const alert = page.getByRole('alert').filter({ hasText: 'košík ostal zachovaný' });
    await expect(alert).toBeVisible({ timeout: 90_000 });

    // Still on the checkout page.
    expect(new URL(page.url()).pathname).toBe('/checkout');

    // The cart is preserved: the order summary still lists the item and the
    // persisted cart still holds it.
    await expect(page.getByText(`${PRODUCT_NAME} x 1`)).toBeVisible();
    expect(await readCartItems(page)).toHaveLength(1);

    // No blocking browser dialog was used for the error.
    expect(dialogs).toEqual([]);

    // The order itself did reach the API before the payment session failed —
    // a retry would reuse it via clientRequestId.
    const ordersResponse = await request.get(`${mockApiUrl}/__mock__/orders`);
    expect(ordersResponse.ok()).toBe(true);
    const orders = (await ordersResponse.json()) as Array<Record<string, any>>;
    expect(orders.filter((entry) => entry.customer?.email === email)).toHaveLength(1);

    // The storefront header still shows the cart badge with the kept item.
    await page.goto('/?tenant=pornopizza', { timeout: 120_000, waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('button', { name: 'Košík' }).getByText('1', { exact: true }),
    ).toBeVisible({ timeout: 90_000 });
  });
});
