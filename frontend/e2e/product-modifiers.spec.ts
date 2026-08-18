import { expect, test } from '@playwright/test';

/**
 * Regression for "Invalid modifier ID 'dough' ... Bezlepkový posúch":
 * a product that defines its own modifiers must offer ONLY those in the
 * customization modal (not the category preset), so the order the storefront
 * builds is exactly what the backend validates against.
 */
test.describe('product-defined modifiers', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      for (const key of ['cookie_analytics', 'cookie_marketing']) window.localStorage.setItem(key, 'false');
    });
  });

  test('STANGLE product offers only its own modifier (edge), not the category preset', async ({ page }) => {
    await page.goto('/?tenant=pornopizza');

    // Open the posuch: STANGLE products open the customization modal.
    // Scope the "Pridať" click to the card that shows our product name.
    const card = page.locator('article, div').filter({ hasText: 'Testovaci posuch' }).filter({ has: page.getByRole('button', { name: 'Pridať' }) }).last();
    await expect(card).toBeVisible({ timeout: 30_000 });
    await expect(async () => {
      await card.getByRole('button', { name: 'Pridať' }).first().click();
      await expect(page.getByRole('button', { name: /Pridať do košíka/ })).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });

    // Only the OKRAJ group is offered — no PODKLAD (dough), SYR (cheese) or ZÁKLAD (sauce).
    await expect(page.getByText(/OKRAJ/)).toBeVisible();
    await expect(page.getByText(/PODKLAD/)).toHaveCount(0);
    await expect(page.getByText(/^🧀 SYR/)).toHaveCount(0);
    await expect(page.getByText(/ZÁKLAD/)).toHaveCount(0);

    // Pick an edge and add to cart — must not require dough/cheese/sauce.
    await page.getByText('Cesnakom').first().click();
    await page.getByRole('button', { name: /Pridať do košíka/ }).click();
    await expect(page.getByRole('button', { name: 'Pokračovať k platbe' })).toBeVisible({ timeout: 10_000 });
  });
});

test('a cart persisted with stale modifier groups still checks out (payload is sanitized)', async ({ page }) => {
  await page.addInitScript(() => {
    for (const key of ['cookie_analytics', 'cookie_marketing']) window.localStorage.setItem(key, 'false');
    // Simulate a cart saved by the OLD modal: STANGLE product with dough/cheese/sauce chosen.
    const cart = {
      state: {
        items: [{
          id: 'e2e-posuch-1-{"dough":["classic-32"],"cheese":["mozzarella"],"sauce":["tomato"],"edge":["garlic"]}',
          product: { id: 'e2e-posuch-1', name: 'Testovaci posuch', priceCents: 450, category: 'STANGLE', isActive: true,
            modifiers: [{ id: 'edge', name: 'OKRAJ', type: 'single', required: true, options: [{ id: 'garlic', name: 'Cesnakom', priceCents: 0 }] }] },
          quantity: 1,
          modifiers: { dough: ['classic-32'], cheese: ['mozzarella'], sauce: ['tomato'], edge: ['garlic'] },
        }],
      },
      version: 0,
    };
    window.localStorage.setItem('cart-storage', JSON.stringify(cart));
  });
  await page.route('**://nominatim.openstreetmap.org/**', async (route) => {
    const body = route.request().url().includes('limit=1')
      ? JSON.stringify([{ display_name: 'Testovacia 1, Bratislava', lat: '48.1486', lon: '17.1077', address: { road: 'Testovacia', house_number: '1', city: 'Bratislava', postcode: '81101', country_code: 'sk' } }])
      : '[]';
    await route.fulfill({ status: 200, contentType: 'application/json', body });
  });

  await page.goto('/checkout?tenant=pornopizza');
  await expect(page.getByRole('heading', { name: 'Pokladňa' })).toBeVisible({ timeout: 90_000 });
  await page.getByPlaceholder('Např. Ján Novák').fill('Jan Tester');
  await page.getByPlaceholder('napr. jan.novak@email.com').fill(`stale-${Date.now()}@example.com`);
  await page.getByPlaceholder('900 123 456').fill('912345678');
  await page.getByPlaceholder('Zadajte adresu').fill('Testovacia 1');
  await page.locator('label:has-text("Mesto") + input').fill('Bratislava');
  await page.locator('label:has-text("PSČ") + input').fill('81101');
  await expect(page.getByText('Bratislava Test Zone')).toBeVisible({ timeout: 30_000 });

  const orderReq = page.waitForRequest((r) => r.url().includes('/api/pornopizza/orders') && r.method() === 'POST');
  await page.getByRole('button', { name: 'Zaplatiť', exact: true }).click();
  const req = await orderReq;
  const body = req.postDataJSON();
  // Only the group the product defines survives.
  expect(Object.keys(body.items[0].modifiers)).toEqual(['edge']);
  await page.waitForURL('**/mock-gateway**', { timeout: 90_000 });
});
