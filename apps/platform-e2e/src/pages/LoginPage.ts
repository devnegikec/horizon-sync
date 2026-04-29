import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly loginCard: Locator;
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly passwordError: Locator;
  readonly emailError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginCard = page.locator('[data-testid="login-card"]');
    this.loginForm = page.locator('[data-testid="login-form"]');
    this.emailInput = page.locator('[data-testid="login-email"]');
    this.passwordInput = page.locator('[data-testid="login-password"]');
    this.signInButton = page.locator('[data-testid="login-submit"]');
    this.forgotPasswordLink = page.locator('[data-testid="login-forgot-password"]');
    this.successMessage = page.locator('[data-testid="login-success"]');
    this.errorMessage = page.locator('[data-testid="login-error"]');
    this.passwordError = page.locator('[data-testid="login-password-error"]');
    this.emailError = page.locator('[data-testid="login-email-error"]');
  }

  async goto() {
    await this.page.goto('/login');
    await this.dismissDevOverlay();
    await this.loginCard.waitFor({ state: 'visible' });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  /**
   * Remove the webpack-dev-server overlay iframe that intercepts pointer events.
   * This only appears in dev mode and blocks all clicks.
   */
  private async dismissDevOverlay() {
    await this.page.evaluate(() => {
      const overlay = document.getElementById('webpack-dev-server-client-overlay');
      if (overlay) overlay.remove();
    });
  }
}
