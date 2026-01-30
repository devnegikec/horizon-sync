import { Page, Locator } from '@playwright/test';

export class RegistrationPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly phoneInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('registration-email');
    this.firstNameInput = page.getByTestId('registration-first-name');
    this.lastNameInput = page.getByTestId('registration-last-name');
    this.phoneInput = page.getByTestId('registration-phone');
    this.passwordInput = page.getByTestId('registration-password');
    this.confirmPasswordInput = page.getByTestId('registration-confirm-password');
    this.submitButton = page.getByTestId('registration-submit-button');
    this.successMessage = page.getByTestId('toast-title').filter({ hasText: 'Registration successful!' });
  }

  async goto() {
    await this.page.goto('/register');
  }

  async register(data: any) {
    await this.emailInput.fill(data.email);
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.phoneInput.fill(data.phone);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.confirmPassword);
    await this.submitButton.click();
  }
}
