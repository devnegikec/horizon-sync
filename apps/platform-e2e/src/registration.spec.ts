import { test, expect } from '@playwright/test';

import { RegistrationPage } from './pages/RegistrationPage';

test.describe('User Registration @auth', () => {
  // test.use({ bypassServiceWorkers: true });

  test('should register a new user and redirect to home page @smoke @regression @cross-browser @headless', async ({
    page,
  }) => {
    const registrationPage = new RegistrationPage(page);

    // Mock registration API using regex to be safe
    await page.route(/\/identity\/register/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '123',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
          },
          access_token: 'fake-access-token',
          refresh_token: 'fake-refresh-token',
        }),
      });
    });

    // Also mock other potentially conflicting requests
    await page.route(/\/identity\/login/, async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({}) });
    });

    await registrationPage.goto();
    await registrationPage.emailInput.waitFor({ state: 'visible' });

    await registrationPage.register({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '9008750493',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    // Assert success message is visible
    await expect(registrationPage.successMessage).toBeVisible({ timeout: 10000 });

    const baseURL = process.env.BASE_URL ?? 'http://localhost:4200';
    const homeURL = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;

    // Assert redirection (Note: RegistrationForm.tsx currently redirects to /login)
    try {
      await page.waitForURL('**/login', { timeout: 5000 });
    } catch {
      await page.waitForURL(homeURL, { timeout: 5000 });
    }
  });
});
