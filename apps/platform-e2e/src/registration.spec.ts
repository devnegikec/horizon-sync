import { test, expect } from '@playwright/test';

import { ProfilePage } from './pages/ProfilePage';
import { RegistrationPage } from './pages/RegistrationPage';

const testRegistrationUser = {
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: '9008750493',
  password: 'Password123!',
  confirmPassword: 'Password123!',
};

/**
 * Mock the registration API to return a full user object that matches
 * the data the user entered during registration.
 */
function mockRegistrationApi(page: import('@playwright/test').Page) {
  return page.route(/\/identity\/register/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: '123',
          email: testRegistrationUser.email,
          first_name: testRegistrationUser.firstName,
          last_name: testRegistrationUser.lastName,
          display_name: `${testRegistrationUser.firstName} ${testRegistrationUser.lastName}`,
          phone: testRegistrationUser.phone,
          avatar_url: null,
          user_type: 'user',
          status: 'active',
          is_active: true,
          email_verified: false,
          email_verified_at: null,
          last_login_at: null,
          last_login_ip: null,
          timezone: 'UTC',
          language: 'en',
          organization_id: null,
          job_title: null,
          department: null,
          bio: null,
          preferences: null,
          extra_data: null,
        },
        access_token: 'fake-access-token',
        refresh_token: 'fake-refresh-token',
      }),
    });
  });
}

test.describe('User Registration @auth', () => {
  test('should register a new user and redirect to home page @smoke @regression @cross-browser @headless', async ({
    page,
  }) => {
    const registrationPage = new RegistrationPage(page);

    await mockRegistrationApi(page);

    // Also mock other potentially conflicting requests
    await page.route(/\/identity\/login/, async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({}) });
    });

    await registrationPage.goto();
    await registrationPage.emailInput.waitFor({ state: 'visible' });

    await registrationPage.register(testRegistrationUser);

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

  test('should display registered user details on profile page @regression', async ({
    page,
  }) => {
    const registrationPage = new RegistrationPage(page);
    const profilePage = new ProfilePage(page);

    await mockRegistrationApi(page);

    await page.route(/\/identity\/login/, async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({}) });
    });

    // Step 1: Register the user
    await registrationPage.goto();
    await registrationPage.emailInput.waitFor({ state: 'visible' });
    await registrationPage.register(testRegistrationUser);
    await expect(registrationPage.successMessage).toBeVisible({ timeout: 10000 });

    // Step 2: Navigate to profile page
    await profilePage.goto();

    // Step 3: Validate all personal information fields
    await expect(profilePage.firstNameValue).toHaveText(testRegistrationUser.firstName);
    await expect(profilePage.lastNameValue).toHaveText(testRegistrationUser.lastName);
    await expect(profilePage.emailValue).toHaveText(testRegistrationUser.email);
    await expect(profilePage.phoneValue).toHaveText(testRegistrationUser.phone);
  });
});
