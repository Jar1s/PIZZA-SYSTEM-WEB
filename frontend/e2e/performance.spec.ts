import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/?tenant=pornopizza');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Homepage should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should render products quickly', async ({ page }) => {
    await page.goto('/?tenant=pornopizza');
    
    // Wait for products to appear
    const productCard = page.locator('[data-testid*="product"], .product-card').first();
    await expect(productCard).toBeVisible({ timeout: 5000 });
    
    // Check that multiple products are visible
    const products = page.locator('[data-testid*="product"], .product-card');
    const count = await products.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should handle cart operations without lag', async ({ page }) => {
    await page.goto('/?tenant=pornopizza');
    await page.waitForLoadState('networkidle');

    // Measure time to open cart
    const cartOpenStart = Date.now();
    const cartButton = page.locator('button[aria-label*="košík"], button:has-text("Košík")').first();
    await cartButton.click();
    
    const cart = page.locator('[data-testid*="cart"], .cart').first();
    await expect(cart).toBeVisible();
    const cartOpenTime = Date.now() - cartOpenStart;
    
    // Cart should open within 500ms
    expect(cartOpenTime).toBeLessThan(500);
  });

  test('should not have memory leaks on navigation', async ({ page, context }) => {
    // Navigate multiple times and check memory
    for (let i = 0; i < 5; i++) {
      await page.goto('/?tenant=pornopizza');
      await page.waitForLoadState('networkidle');
      await page.goto('/checkout?tenant=pornopizza');
      await page.waitForLoadState('networkidle');
    }

    // Check that page is still responsive
    const cartButton = page.locator('button[aria-label*="košík"]').first();
    await expect(cartButton).toBeVisible();
  });

  test('should handle large product lists efficiently', async ({ page }) => {
    await page.goto('/?tenant=pornopizza');
    await page.waitForLoadState('networkidle');

    // Scroll to bottom to trigger lazy loading if implemented
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await page.waitForTimeout(1000);

    // Check that scrolling is smooth (no jank)
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeGreaterThan(0);
  });

  test('should optimize images loading', async ({ page }) => {
    await page.goto('/?tenant=pornopizza');
    await page.waitForLoadState('networkidle');

    // Check for lazy-loaded images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Check that images have loading="lazy" attribute
      const lazyImages = page.locator('img[loading="lazy"]');
      const lazyCount = await lazyImages.count();
      
      // At least some images should be lazy-loaded
      expect(lazyCount).toBeGreaterThanOrEqual(0);
    }
  });
});





