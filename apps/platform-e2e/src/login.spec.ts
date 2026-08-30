import { test, expect } from '@playwright/test';

import { testUsers } from './config/test-users';
import { LoginPage } from './pages/LoginPage';

test.describe('User Login @auth', () => {
  const { email, password } = testUsers.default;

  // TODO: Disabled 2026-08-27 — requires live identity backend. Re-enable in next development.
  /*
  test('should login and redirect to dashboard @smoke @regression', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();

    // Verify login page loaded
    await expect(loginPage.loginCard).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.signInButton).toBeVisible();

    // Fill credentials and submit
    await loginPage.login(email, password);

    // Wait for success message or redirect
    await expect(async () => {
      const url = page.url();
      expect(url).not.toContain('/login');
    }).toPass({ timeout: 15000 });
  });
  */

  test('should show error for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'WrongPassword1!');

    // Verify error message appears
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('should show validation error when password is empty', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.emailInput.fill(email);
    await loginPage.signInButton.click();

    // Verify validation error
    await expect(loginPage.passwordError).toBeVisible({ timeout: 5000 });
  });
});
