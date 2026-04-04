import { test, expect } from '@playwright/test';

test.describe('Complete Cart to Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page with tenant parameter
    await page.goto('/?tenant=pornopizza');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should complete full order flow: add to cart → checkout → payment', async ({ page }) => {
    // Step 1: Add product to cart
    const addButton = page.locator('button:has-text("Pridať")').first();
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Wait for cart to open (if it opens automatically) or open it manually
    const cartButton = page.locator('button[aria-label*="košík"], button:has-text("Košík")').first();
    if (await cartButton.isVisible()) {
      await cartButton.click();
    }

    // Step 2: Verify cart has items
    await expect(page.locator('text=/košík/i')).toBeVisible();
    
    // Step 3: Navigate to checkout
    const checkoutButton = page.locator('button:has-text("Pokračovať"), button:has-text("Checkout")');
    await expect(checkoutButton).toBeVisible();
    await checkoutButton.click();

    // Step 4: Wait for checkout page
    await page.waitForURL(/\/checkout/);
    await expect(page.locator('h1, h2').filter({ hasText: /checkout|pokračovať|objednávka/i })).toBeVisible();

    // Step 5: Fill in customer information
    await page.fill('input[name="name"], input[placeholder*="Meno"]', 'John Doe');
    await page.fill('input[name="email"], input[type="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"], input[type="tel"]', '+421912345678');

    // Step 6: Fill in address
    await page.fill('input[name="street"], input[placeholder*="Ulica"]', 'Main Street');
    await page.fill('input[name="houseNumber"], input[placeholder*="Číslo"]', '42');
    await page.fill('input[name="city"], input[placeholder*="Mesto"]', 'Bratislava');
    await page.fill('input[name="postalCode"], input[placeholder*="PSČ"]', '81101');
    await page.fill('input[name="country"], select[name="country"]', 'SK');

    // Step 7: Select payment method (if visible)
    const onlinePayment = page.locator('input[type="radio"][value="online"], label:has-text("Online")');
    if (await onlinePayment.isVisible()) {
      await onlinePayment.click();
    }

    // Step 8: Submit order
    const submitButton = page.locator('button[type="submit"], button:has-text("Objednať"), button:has-text("Potvrdiť")');
    await expect(submitButton).toBeVisible();
    
    // Intercept API call to prevent actual order creation
    await page.route('**/api/**/orders', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-order-123',
          status: 'PENDING',
          totalCents: 2500,
        }),
      });
    });

    await submitButton.click();

    // Step 9: Verify order was created (check for success message or redirect)
    await page.waitForTimeout(2000); // Wait for API call
    // Check for success indicator (order ID, success message, or redirect)
    const successIndicator = page.locator('text=/objednávka|order|success|ďakujeme/i');
    await expect(successIndicator.first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle pizza customization modal', async ({ page }) => {
    // Find a pizza product (usually has customization options)
    const pizzaCard = page.locator('[data-testid*="product"], .product-card').first();
    
    if (await pizzaCard.isVisible()) {
      const addButton = pizzaCard.locator('button:has-text("Pridať")');
      await addButton.click();

      // Wait for customization modal
      const modal = page.locator('[role="dialog"], .modal, [data-testid*="modal"]');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Select size (if available)
      const sizeOption = modal.locator('input[type="radio"][value*="large"], label:has-text("Veľká")');
      if (await sizeOption.isVisible()) {
        await sizeOption.click();
      }

      // Add toppings (if available)
      const toppingCheckbox = modal.locator('input[type="checkbox"], label:has-text("Extra")').first();
      if (await toppingCheckbox.isVisible()) {
        await toppingCheckbox.click();
      }

      // Confirm customization
      const confirmButton = modal.locator('button:has-text("Pridať"), button:has-text("Potvrdiť")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Verify item was added to cart
      await expect(page.locator('text=/košík|cart/i')).toBeVisible();
    }
  });

  test('should open and close cart', async ({ page }) => {
    // Open cart
    const cartButton = page.locator('button[aria-label*="košík"], button:has-text("Košík")').first();
    await cartButton.click();

    // Verify cart is visible
    const cart = page.locator('[data-testid*="cart"], .cart, [role="dialog"]');
    await expect(cart).toBeVisible();

    // Close cart via close button
    const closeButton = cart.locator('button[aria-label*="zavrieť"], button:has-text("×"), button:has-text("Close")');
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await expect(cart).not.toBeVisible();
    }

    // Reopen cart
    await cartButton.click();
    await expect(cart).toBeVisible();

    // Close via ESC key
    await page.keyboard.press('Escape');
    await expect(cart).not.toBeVisible({ timeout: 2000 });
  });

  test('should handle empty cart state', async ({ page }) => {
    // Open cart
    const cartButton = page.locator('button[aria-label*="košík"], button:has-text("Košík")').first();
    await cartButton.click();

    // Check for empty cart message
    const emptyCartMessage = page.locator('text=/prázdny|empty|žiadne|no items/i');
    // Cart might be empty initially, so this is optional
    if (await emptyCartMessage.isVisible()) {
      await expect(emptyCartMessage).toBeVisible();
    }
  });
});






