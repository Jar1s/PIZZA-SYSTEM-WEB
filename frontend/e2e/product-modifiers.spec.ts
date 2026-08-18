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
