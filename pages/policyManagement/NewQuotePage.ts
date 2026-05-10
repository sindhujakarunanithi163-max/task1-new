import { Page, Locator } from '@playwright/test';

export class NewQuotePage {
  readonly page: Page;
  readonly hamburgerBtn: Locator;
  readonly policyManagementNav: Locator;
  readonly newQuoteLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.hamburgerBtn = page.locator('#vertical-menu-btn');
    this.policyManagementNav = page.locator('a:has([data-key="t-policy"])').filter({ hasText: 'Policy Management' });
    this.newQuoteLink = page.locator('a:has([data-key="t-quote"])').filter({ hasText: 'New Quote' });
  }

  async simpleNavigateToNewQuote(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.hamburgerBtn.waitFor({ state: 'visible', timeout: 30000 });
    await this.hamburgerBtn.click();
    await this.policyManagementNav.waitFor({ state: 'visible' });
    await this.policyManagementNav.click();
    await this.newQuoteLink.waitFor({ state: 'visible' });
    await this.newQuoteLink.click();
    await this.page.waitForURL(/new-quote/);
  }
}
