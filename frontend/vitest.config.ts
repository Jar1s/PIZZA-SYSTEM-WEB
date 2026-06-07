import { configDefaults, defineConfig } from 'vitest/config';

// Vitest runs the unit tests only. Playwright owns everything under e2e/, so it
// must be excluded here — otherwise Vitest tries to load Playwright specs and
// fails with "Playwright Test did not expect test() to be called here".
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'e2e/**', 'playwright.config.ts'],
  },
});
