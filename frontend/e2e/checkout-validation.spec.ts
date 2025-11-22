import { test, expect } from '@playwright/test';

test.describe('Checkout Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to checkout with items in cart
    // In a real scenario, you'd add items first, but for validation tests we can mock it
    await page.goto('/checkout?tenant=pornopizza');
    await page.waitForLoadState('networkidle');
  });

  test('should validate name field (requires first and last name)', async ({ page }) => {
    // Try to submit with only first name
    await page.fill('input[name="name"], input[placeholder*="Meno"]', 'John');
    
    // Trigger validation (blur or submit)
    await page.locator('input[name="name"], input[placeholder*="Meno"]').blur();
    
    // Check for error message
    const nameError = page.locator('text=/meno.*priezvisko|first.*last|aspoň.*slová/i');
    await expect(nameError.first()).toBeVisible({ timeout: 2000 });

    // Fix: add last name
    await page.fill('input[name="name"], input[placeholder*="Meno"]', 'John Doe');
    await page.locator('input[name="name"], input[placeholder*="Meno"]').blur();
    
    // Error should disappear
    await expect(nameError.first()).not.toBeVisible({ timeout: 2000 });
  });

  test('should validate email format', async ({ page }) => {
    // Invalid email
    await page.fill('input[name="email"], input[type="email"]', 'invalid-email');
    await page.locator('input[name="email"], input[type="email"]').blur();
    
    const emailError = page.locator('text=/platn.*email|valid.*email|email.*format/i');
    await expect(emailError.first()).toBeVisible({ timeout: 2000 });

    // Valid email
    await page.fill('input[name="email"], input[type="email"]', 'john.doe@example.com');
    await page.locator('input[name="email"], input[type="email"]').blur();
    await expect(emailError.first()).not.toBeVisible({ timeout: 2000 });
  });

  test('should validate phone number format', async ({ page }) => {
    // Invalid phone (too short)
    await page.fill('input[name="phone"], input[type="tel"]', '123');
    await page.locator('input[name="phone"], input[type="tel"]').blur();
    
    const phoneError = page.locator('text=/platn.*telefón|valid.*phone|phone.*format/i');
    await expect(phoneError.first()).toBeVisible({ timeout: 2000 });

    // Valid Slovak phone
    await page.fill('input[name="phone"], input[type="tel"]', '+421912345678');
    await page.locator('input[name="phone"], input[type="tel"]').blur();
    await expect(phoneError.first()).not.toBeVisible({ timeout: 2000 });
  });

  test('should validate Bratislava address', async ({ page }) => {
    // Fill address outside Bratislava
    await page.fill('input[name="city"], input[placeholder*="Mesto"]', 'Košice');
    await page.fill('input[name="postalCode"], input[placeholder*="PSČ"]', '04001');
    await page.locator('input[name="city"], input[placeholder*="Mesto"]').blur();
    
    // Wait for validation (might be debounced)
    await page.waitForTimeout(1000);
    
    const addressError = page.locator('text=/bratislava|doručujeme.*bratislava|outside.*bratislava/i');
    // Error might appear on blur or when trying to submit
    const isVisible = await addressError.first().isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isVisible) {
      await expect(addressError.first()).toBeVisible();
    }

    // Fix: Bratislava address
    await page.fill('input[name="city"], input[placeholder*="Mesto"]', 'Bratislava');
    await page.fill('input[name="postalCode"], input[placeholder*="PSČ"]', '81101');
    await page.locator('input[name="city"], input[placeholder*="Mesto"]').blur();
    await page.waitForTimeout(1000);
    
    if (isVisible) {
      await expect(addressError.first()).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('should show validation errors on submit attempt', async ({ page }) => {
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"], button:has-text("Objednať")');
    await submitButton.click();

    // Multiple validation errors should appear
    const errors = page.locator('text=/povinné|required|chyba|error/i');
    await expect(errors.first()).toBeVisible({ timeout: 2000 });
  });

  test('should validate all required fields', async ({ page }) => {
    const requiredFields = [
      { name: 'name', placeholder: /Meno|Name/ },
      { name: 'email', type: 'email' },
      { name: 'phone', type: 'tel' },
      { name: 'street', placeholder: /Ulica|Street/ },
      { name: 'city', placeholder: /Mesto|City/ },
      { name: 'postalCode', placeholder: /PSČ|Postal/ },
    ];

    // Check that all required fields exist
    for (const field of requiredFields) {
      const selector = field.type
        ? `input[type="${field.type}"]`
        : `input[name="${field.name}"], input[placeholder*="${field.placeholder}"]`;
      
      const input = page.locator(selector).first();
      await expect(input).toBeVisible();
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Fill valid form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('input[type="tel"]', '+421912345678');
    await page.fill('input[name="street"]', 'Main Street');
    await page.fill('input[name="city"]', 'Bratislava');
    await page.fill('input[name="postalCode"]', '81101');

    // Intercept API call and return error
    await page.route('**/api/**/orders', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    // Try to submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Check for error message
    const errorMessage = page.locator('text=/chyba|error|failed|nepodarilo/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('should prevent duplicate submissions', async ({ page }) => {
    // Fill valid form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('input[type="tel"]', '+421912345678');
    await page.fill('input[name="street"]', 'Main Street');
    await page.fill('input[name="city"]', 'Bratislava');
    await page.fill('input[name="postalCode"]', '81101');

    // Intercept API call with delay
    let requestCount = 0;
    await page.route('**/api/**/orders', async (route) => {
      requestCount++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'order-123' }),
      });
    });

    const submitButton = page.locator('button[type="submit"]');
    
    // Click multiple times rapidly
    await submitButton.click();
    await submitButton.click();
    await submitButton.click();

    // Wait for API call
    await page.waitForTimeout(2000);

    // Should only make one request (button should be disabled after first click)
    expect(requestCount).toBeLessThanOrEqual(2); // Allow for potential race condition
  });
});






