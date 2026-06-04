import { expect, test } from '@playwright/test';

test('renders a public static page', async ({ page }) => {
  await page.goto('/cookies');

  await expect(page).toHaveTitle(/cookies|cookie|pizza/i);
  await expect(page.getByText(/cookies/i).first()).toBeVisible();
});
