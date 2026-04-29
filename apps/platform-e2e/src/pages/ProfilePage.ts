import { Page, Locator } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;
  readonly firstNameValue: Locator;
  readonly lastNameValue: Locator;
  readonly emailValue: Locator;
  readonly phoneValue: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameValue = page.getByTestId('profile-first-name-value');
    this.lastNameValue = page.getByTestId('profile-last-name-value');
    this.emailValue = page.getByTestId('profile-email-value');
    this.phoneValue = page.getByTestId('profile-phone-value');
  }

  async goto() {
    await this.page.goto('/profile');
  }
}
