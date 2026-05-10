import { Page, Locator } from '@playwright/test';
import { EnvConfig } from '../config/env';

export class LoginPage {
  readonly page: Page;
  readonly username: Locator;
  readonly password: Locator;
  readonly loginBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.username = page.getByPlaceholder('Enter Username');
    this.password = page.getByPlaceholder('Enter Password');
    this.loginBtn = page.getByRole('button', { name: 'Log In' });
  }

  async goto(envConfig: EnvConfig): Promise<void> {
    await this.page.goto(envConfig.baseURL);
  }

  async login(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginBtn.click();
  }

  async loginAndVerify(username: string, password: string): Promise<void> {
    await this.login(username, password);
    await this.page.locator('#vertical-menu-btn').waitFor({ state: 'visible', timeout: 60000 });
    const origin = new URL(this.page.url()).origin;
    await this.page.goto(`${origin}/policy-management/policy-dashboard`, { waitUntil: 'domcontentloaded' });
  }
}
