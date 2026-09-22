import { test, expect } from '@playwright/test';

// Smoke test — verifies the standalone inventory app boots and renders its nav.
test('inventory app bootstraps and shows navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Items' })).toBeVisible();
});
