import { Page, Locator, expect } from '@playwright/test';

export interface NewQuoteFormData {
  insuredName: string;
  zip: string;
  address: string;
  classCode: string;
  classCodeZip: string;
  classCodeAddress: string;
  crimeIndex: string;
  exposureAmount: string;
  r2ClassCode: string;
  r2ExposureAmount: string;
  l2ClassCode: string;
  l2ClassCodeZip: string;
  l2ClassCodeAddress: string;
  l2ExposureAmount: string;
  l2r1minimumpremium: string;
  l3classcode: string;
  l3classcodezip: string;
  l3classcodeaddress: string;
  l3crimeindex: string;
  l3classcodeexposure: string;
  l4ClassCode: string;
  l4ClassCodeZip: string;
  l4ClassCodeAddress: string;
  l4classcodeexposure: string;
  l4OverridePremium: string;
  [key: string]: string;
}

export class NewQuoteFormPage {
  readonly page: Page;

  // Account Info
  readonly insuredNameInput: Locator;
  readonly zipInput: Locator;
  readonly cityInput: Locator;
  readonly stateSelect: Locator;
  readonly addressInput: Locator;
  readonly formOfBusinessSelect: Locator;

  // GL section toggle
  readonly glTabToggleLabel: Locator;
  readonly glTabToggleCheckbox: Locator;

  // GL / LL Coverage checkboxes
  readonly glCoverageCheckbox: Locator;
  readonly llCoverageCheckbox: Locator;

  // LOB Level QQ
  readonly lobQQTable: Locator;

  // Common LOB Level QQ
  readonly commonLobQQTable: Locator;

  // GL Deductible
  readonly glDeductibleRadioBtn: Locator;
  readonly bodilyInjCheckbox: Locator;
  readonly propDamCheckbox: Locator;
  readonly persAdvCheckbox: Locator;
  readonly generalSirDeductible: Locator;

  // Class Code Builder
  readonly classCodeInput: Locator;
  readonly classCodeZipInput: Locator;
  readonly classCodeAddressInput: Locator;
  readonly classBuilderAddBtn: Locator;
  readonly typeaheadListItem: Locator;

  // Location / Risk Table
  readonly locationTable: Locator;
  readonly addRiskBtn: Locator;
  readonly crimeIndexInput: Locator;
  readonly exposureAmountInput: Locator;
  readonly finalRateInput: Locator;
  readonly finalPremiumInput: Locator;

  // Risk Level QQ
  readonly riskLevelQQTable: Locator;

  // If Any toggle / Minimum Premium / Override Premium / Clone
  readonly ifAnyToggle: Locator;
  readonly minimumPremiumInput: Locator;
  readonly overridePremiumInput: Locator;
  readonly cloneBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    // Account Info
    this.insuredNameInput      = page.locator('#nameInsured');
    this.zipInput              = page.locator('#typeahead_id');
    this.cityInput             = page.locator('#typeahead_id_city');
    this.stateSelect           = page.locator('#accountState');
    this.addressInput          = page.locator('#typeahead_id_add');
    this.formOfBusinessSelect  = page.locator('#accountFormBusiness');

    // GL toggle
    this.glTabToggleCheckbox   = page.locator('#glTabchkbox');
    this.glTabToggleLabel      = page.locator('label[for="glTabchkbox"]');
    this.glCoverageCheckbox    = page.locator('input#gl');
    this.llCoverageCheckbox    = page.locator('input#ll');

    // LOB QQ
    this.lobQQTable            = page.locator('#policyLevelQQTbl');

    // Common LOB QQ
    this.commonLobQQTable      = page.locator('#policyLevelQQTbl2');

    // GL Deductible
    this.glDeductibleRadioBtn  = page.locator('#glDeductibleRadioBtn');
    this.bodilyInjCheckbox     = page.locator('#bodilyInj');
    this.propDamCheckbox       = page.locator('#propDam');
    this.persAdvCheckbox       = page.locator('#persAdv');
    this.generalSirDeductible  = page.locator('#generalSirDeductible');

    // Class Code Builder
    this.classCodeInput        = page.locator('input.glClassCodeBuilder[placeholder="Class Code"]');
    this.classCodeZipInput     = page.locator('input.creatorZipVal');
    this.classCodeAddressInput = page.locator('input.glAddressInput');
    this.classBuilderAddBtn    = page.locator('button.classBuilderAddBtnDesign');
    this.typeaheadListItem     = page.locator('.simple-typeahead-list-item');

    // Location / Risk Table
    this.locationTable         = page.locator('#gllocationTable');
    this.addRiskBtn            = page.locator('#gllocationTable #addRisk');
    this.crimeIndexInput       = page.locator('input#classBuilderCrimeIndex');
    this.exposureAmountInput   = page.locator('input#exposureAmountInput');
    this.finalRateInput        = page.locator('input#classBuilderFinalRate');
    this.finalPremiumInput     = page.locator('input#classBuilderPremium');

    // Risk Level QQ
    this.riskLevelQQTable      = page.locator('#riskLevelQQTbl');

    // If Any toggle / Minimum Premium
    this.ifAnyToggle           = page.locator('label[for*="glIfany"]');
    this.minimumPremiumInput   = page.locator('input.minpremsystem');
    this.overridePremiumInput  = page.locator('input#glOverrideModInput');
    this.cloneBtn              = page.locator('span[title="Clone"]');
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
    await this.zipInput.selectText();
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

  async selectQualifyingAnswer(questionText: string, answer: 'Yes' | 'No'): Promise<void> {
    const row = this.page.locator('tr').filter({ hasText: questionText }).first();
    await row.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(400);
    const label = row.locator('label').filter({ hasText: answer });
    await label.waitFor({ state: 'visible', timeout: 10000 });
    await label.click();
    await this.page.waitForTimeout(800);
  }

  async validateMessage(questionText: string, expectedMessage: string): Promise<void> {
    const row = this.page.locator('tr').filter({ hasText: questionText }).first();
    await expect(row.getByText(expectedMessage, { exact: false })).toBeVisible({ timeout: 10000 });
  }

  async selectCommonLobAnswer(questionText: string, answer: 'Yes' | 'No'): Promise<void> {
    const row = this.commonLobQQTable.locator('tr').filter({ hasText: questionText }).first();
    await row.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(400);
    const label = row.locator('label').filter({ hasText: answer });
    await label.waitFor({ state: 'visible', timeout: 10000 });
    await label.click();
    await this.page.waitForTimeout(800);
  }

  async validateCommonLobMessage(questionText: string, expectedMessage: string): Promise<void> {
    const row = this.commonLobQQTable.locator('tr').filter({ hasText: questionText }).first();
    await expect(row.getByText(expectedMessage, { exact: false })).toBeVisible({ timeout: 10000 });
  }

  async selectRiskLevelAnswer(questionText: string, answer: 'Yes' | 'No'): Promise<void> {
    const row = this.riskLevelQQTable.locator('tr').filter({ hasText: questionText }).first();
    await row.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(400);
    const label = row.locator('label').filter({ hasText: answer });
    await label.waitFor({ state: 'visible', timeout: 10000 });
    await label.click();
    await this.page.waitForTimeout(800);
  }

  async validateRiskLevelMessage(questionText: string, expectedMessage: string): Promise<void> {
    const row = this.riskLevelQQTable.locator('tr').filter({ hasText: questionText }).first();
    await expect(row.getByText(expectedMessage, { exact: false })).toBeVisible({ timeout: 30000 });
  }
}
