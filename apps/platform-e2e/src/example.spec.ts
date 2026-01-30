import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect h1 to contain a substring.
  // When not logged in, it redirects to /login which has "Access Your Workspace" or "Welcome back"
  const h1 = page.locator('h1');
  await expect(h1).toBeVisible();
  const text = await h1.innerText();
  expect(text).toMatch(/Welcome|Access Your Workspace|Welcome back/);
});
