import { Page, Locator } from '@playwright/test';

export interface NewQuoteFormData {
  zip: string;
  insuredName: string;
  address: string;
  [key: string]: string;
}

export class NewQuoteFormPage {
  readonly page: Page;
  readonly insuredNameInput: Locator;
  readonly zipInput: Locator;
  readonly cityInput: Locator;
  readonly stateSelect: Locator;
  readonly addressInput: Locator;
  readonly formOfBusinessSelect: Locator;

  // GL section toggle (enables GL coverage — No to Yes)
  readonly glTabToggleLabel: Locator;
  readonly glTabToggleCheckbox: Locator;

  // GL Coverage Type checkboxes (visible after GL section is enabled)
  readonly glCoverageCheckbox: Locator;
  readonly llCoverageCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.insuredNameInput     = page.locator('#nameInsured');
    this.zipInput             = page.locator('#typeahead_id');
    this.cityInput            = page.locator('#typeahead_id_city');
    this.stateSelect          = page.locator('#accountState');
    this.addressInput         = page.locator('#typeahead_id_add');
    this.formOfBusinessSelect = page.locator('#accountFormBusiness');

    this.glTabToggleCheckbox  = page.locator('#glTabchkbox');
    this.glTabToggleLabel     = page.locator('label[for="glTabchkbox"]');

    this.glCoverageCheckbox   = page.locator('input#gl');
    this.llCoverageCheckbox   = page.locator('input#ll');
  }

  async enableGlSection(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.glTabToggleLabel.waitFor({ state: 'visible' });
    await this.glTabToggleLabel.click();
    await this.glTabToggleCheckbox.waitFor({ state: 'attached', timeout: 15000 });
    await this.page.waitForLoadState('networkidle', { timeout: 20000 });
    await this.glCoverageCheckbox.waitFor({ state: 'visible', timeout: 20000 });
  }

  async tickGlCoverage(): Promise<void> {
    await this.glCoverageCheckbox.waitFor({ state: 'visible', timeout: 15000 });
    await this.glCoverageCheckbox.check();
  }

  async tickLlCoverage(): Promise<void> {
    await this.llCoverageCheckbox.waitFor({ state: 'visible', timeout: 15000 });
    await this.llCoverageCheckbox.check();
  }

  async fillNewQuoteForm(data: NewQuoteFormData): Promise<void> {
    await this.zipInput.click();
    await this.zipInput.pressSequentially(data.zip, { delay: 100 });
    await this.page.locator('.simple-typeahead-list-item').first().waitFor({ state: 'visible', timeout: 30000 });
    await this.page.locator('.simple-typeahead-list-item').first().evaluate(el => (el as HTMLElement).click());
    await this.page.waitForLoadState('networkidle', { timeout: 15000 });
    await this.insuredNameInput.click();
    await this.insuredNameInput.pressSequentially(data.insuredName, { delay: 100 });
    await this.addressInput.fill(data.address);

    const options = await this.formOfBusinessSelect.locator('option').allTextContents();
    const validOptions = options.filter(opt => opt.trim() !== '--Select--');
    await this.formOfBusinessSelect.selectOption({ label: validOptions[0] });
  }
}
