import { test as base, expect } from '../../fixtures/baseTest';
import { readCsv } from '../../utils/csvReader';
import { NewQuoteFormData } from '../../pages/policyManagement/newquoteformpage';
import type { Page } from '@playwright/test';

const testData = readCsv<NewQuoteFormData>('data/newQuoteData.csv');

// One browser for all tests — single shared page across the entire worker
const test = base.extend<{}, { sharedPage: Page }>({
  sharedPage: [async ({ browser }, use) => {
    const context = await browser.newContext();
    const pg = await context.newPage();
    await use(pg);
    await context.close();
  }, { scope: 'worker' }],

  page: async ({ sharedPage }, use) => {
    await use(sharedPage);
  },
});

for (const row of testData) {
  test(`New Quote Form - ${row.insuredName}`, async ({ loginPage, quotePage, quoteFormPage, envConfig, credentials }) => {
    test.setTimeout(180000);
    // Login
    await loginPage.goto(envConfig);
    await loginPage.loginAndVerify(credentials.username, credentials.password);

    // Fill new quote form (Account Info tab)
    await quotePage.simpleNavigateToNewQuote();
    await quoteFormPage.fillNewQuoteForm(row);

    // Enable GL section (No → Yes)
    await expect(quoteFormPage.glTabToggleCheckbox).not.toBeChecked();
    await quoteFormPage.enableGlSection();
    await expect(quoteFormPage.glTabToggleCheckbox).toBeChecked();

    // GL is pre-checked by default — verify it is checked
    await expect(quoteFormPage.glCoverageCheckbox).toBeChecked();

    // Tick Liquor Liability checkbox
    await quoteFormPage.tickLlCoverage();
    await expect(quoteFormPage.llCoverageCheckbox).toBeChecked();
  });
}

// ─── Helpers: LOB Level - Qualifying Questions ────────────────────────────────

async function selectQualifyingAnswer(page: Page, questionText: string, answer: 'Yes' | 'No'): Promise<void> {
  const row = page.locator('tr').filter({ hasText: questionText }).first();
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const label = row.locator('label').filter({ hasText: answer });
  await label.waitFor({ state: 'visible', timeout: 10000 });
  await label.click();
  await page.waitForTimeout(800);
}

async function validateMessage(page: Page, questionText: string, expectedMessage: string): Promise<void> {
  const row = page.locator('tr').filter({ hasText: questionText }).first();
  await expect(row.getByText(expectedMessage, { exact: false })).toBeVisible({ timeout: 10000 });
}

// ─── LOB Level - Qualifying Questions Tests ───────────────────────────────────

test.describe('LOB Level - Qualifying Questions', () => {
  test.beforeAll(async ({ page, loginPage, quotePage, quoteFormPage, envConfig, credentials }) => {
    test.setTimeout(180000);
    await loginPage.goto(envConfig);
    await loginPage.loginAndVerify(credentials.username, credentials.password);
    await quotePage.simpleNavigateToNewQuote();
    await quoteFormPage.fillNewQuoteForm(testData[0]);
    await quoteFormPage.enableGlSection();
    await quoteFormPage.tickLlCoverage();
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.locator('#policyLevelQQTbl').waitFor({ state: 'visible', timeout: 30000 });
  });

  test('Q1 - Gas/oil/chemical: Yes → Prohibited, No → clears', async ({ page }) => {
    await selectQualifyingAnswer(page, 'Gas, oil or chemical plant operations', 'Yes');
    await validateMessage(page, 'Gas, oil or chemical plant operations', 'Prohibited');
    await selectQualifyingAnswer(page, 'Gas, oil or chemical plant operations', 'No');
    const row = page.locator('tr').filter({ hasText: 'Gas, oil or chemical plant operations' }).first();
    await expect(row.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('Q2 - Marijuana/Cannabis: Yes → Q2.1 appears, No → Q2.1 disappears', async ({ page }) => {
    await selectQualifyingAnswer(page, 'Marijuana/Cannabis or Kava exposures', 'Yes');
    await expect(page.getByText('Is the exposure LRO?', { exact: false })).toBeVisible({ timeout: 10000 });
    await selectQualifyingAnswer(page, 'Marijuana/Cannabis or Kava exposures', 'No');
    await expect(page.getByText('Is the exposure LRO?', { exact: false })).not.toBeVisible();
  });

  test('Q2.1 - LRO exposure: Yes → Submit message, No → Prohibited', async ({ page }) => {
    await selectQualifyingAnswer(page, 'Marijuana/Cannabis or Kava exposures', 'Yes');
    await expect(page.getByText('Is the exposure LRO?', { exact: false })).toBeVisible({ timeout: 10000 });
    await selectQualifyingAnswer(page, 'Is the exposure LRO?', 'Yes');
    await validateMessage(page, 'Is the exposure LRO?', 'Submit');
    await selectQualifyingAnswer(page, 'Is the exposure LRO?', 'No');
    const row21 = page.locator('tr').filter({ hasText: 'Is the exposure LRO?' }).first();
    await expect(row21.getByText('Submit', { exact: false })).not.toBeVisible();
    await expect(row21.getByText('Prohibited', { exact: false })).toBeVisible();
  });

  test('Q3 - New residential construction: Yes → Prohibited, No → clears', async ({ page }) => {
    await selectQualifyingAnswer(page, 'new residential condominium or townhouse', 'Yes');
    await validateMessage(page, 'new residential condominium or townhouse', 'Prohibited');
    await selectQualifyingAnswer(page, 'new residential condominium or townhouse', 'No');
    const row = page.locator('tr').filter({ hasText: 'new residential condominium or townhouse' }).first();
    await expect(row.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('Q4 - Boys or Girls Club: Yes → Prohibited, No → clears', async ({ page }) => {
    await selectQualifyingAnswer(page, 'Boys or Girls Club of America', 'Yes');
    await validateMessage(page, 'Boys or Girls Club of America', 'Prohibited');
    await selectQualifyingAnswer(page, 'Boys or Girls Club of America', 'No');
    const row = page.locator('tr').filter({ hasText: 'Boys or Girls Club of America' }).first();
    await expect(row.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('Q5 - Contractor >20 homes: Yes → Prohibited, No → clears', async ({ page }) => {
    await selectQualifyingAnswer(page, 'construction of more than 20 new residential homes', 'Yes');
    await validateMessage(page, 'construction of more than 20 new residential homes', 'Prohibited');
    await selectQualifyingAnswer(page, 'construction of more than 20 new residential homes', 'No');
    const row = page.locator('tr').filter({ hasText: 'construction of more than 20 new residential homes' }).first();
    await expect(row.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('Q6 - Discontinued Products: Yes → Prohibited, No → clears', async ({ page }) => {
    await selectQualifyingAnswer(page, 'Discontinued Products/Completed Operations', 'Yes');
    await validateMessage(page, 'Discontinued Products/Completed Operations', 'Prohibited');
    await selectQualifyingAnswer(page, 'Discontinued Products/Completed Operations', 'No');
    const row = page.locator('tr').filter({ hasText: 'Discontinued Products/Completed Operations' }).first();
    await expect(row.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('Q7 - Hydraulic fracturing: Yes → Prohibited, No → clears', async ({ page }) => {
    await selectQualifyingAnswer(page, 'hydraulic fracturing or hydrofracking', 'Yes');
    await validateMessage(page, 'hydraulic fracturing or hydrofracking', 'Prohibited');
    await selectQualifyingAnswer(page, 'hydraulic fracturing or hydrofracking', 'No');
    const row = page.locator('tr').filter({ hasText: 'hydraulic fracturing or hydrofracking' }).first();
    await expect(row.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('Q8 - Bar or Tavern: Yes → Prohibited, No → clears', async ({ page }) => {
    await selectQualifyingAnswer(page, 'Bar or Tavern', 'Yes');
    await validateMessage(page, 'Bar or Tavern', 'Prohibited');
    await selectQualifyingAnswer(page, 'Bar or Tavern', 'No');
    const row = page.locator('tr').filter({ hasText: 'Bar or Tavern' }).first();
    await expect(row.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('Q9 - A&B loss: Yes → specific message, No → clears', async ({ page }) => {
    await selectQualifyingAnswer(page, 'A&B loss in the past 3 years', 'Yes');
    await validateMessage(page, 'A&B loss in the past 3 years', 'A&B coverage is prohibited');
    await selectQualifyingAnswer(page, 'A&B loss in the past 3 years', 'No');
    const row = page.locator('tr').filter({ hasText: 'A&B loss in the past 3 years' }).first();
    await expect(row.getByText('A&B coverage is prohibited', { exact: false })).not.toBeVisible();
  });

  test('Q10 - Animal losses: Yes → specific message, No → clears', async ({ page }) => {
    await selectQualifyingAnswer(page, 'animal related losses in past 3 years', 'Yes');
    await validateMessage(page, 'animal related losses in past 3 years', 'Animal Liability coverage is prohibited');
    await selectQualifyingAnswer(page, 'animal related losses in past 3 years', 'No');
    const row = page.locator('tr').filter({ hasText: 'animal related losses in past 3 years' }).first();
    await expect(row.getByText('Animal Liability coverage is prohibited', { exact: false })).not.toBeVisible();
  });

  test('Q11 - GL losses: Yes → Submit message, No → clears', async ({ page }) => {
    await selectQualifyingAnswer(page, 'General Liability losses or a paid or reserved loss exceeding $25,000', 'Yes');
    await validateMessage(page, 'General Liability losses or a paid or reserved loss exceeding $25,000', 'Submit');
    await selectQualifyingAnswer(page, 'General Liability losses or a paid or reserved loss exceeding $25,000', 'No');
    const row11 = page.locator('tr').filter({ hasText: 'General Liability losses or a paid or reserved loss exceeding $25,000' }).first();
    await expect(row11.getByText('Submit', { exact: false })).not.toBeVisible();
    await expect(row11.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('Q12 - Abuse losses: Yes → specific message, No → clears', async ({ page }) => {
    await selectQualifyingAnswer(page, 'Sexual and/or Physical Abuse related losses', 'Yes');
    await validateMessage(page, 'Sexual and/or Physical Abuse related losses', 'Sexual and/or Physical Abuse coverage is prohibited');
    await selectQualifyingAnswer(page, 'Sexual and/or Physical Abuse related losses', 'No');
    const row = page.locator('tr').filter({ hasText: 'Sexual and/or Physical Abuse related losses' }).first();
    await expect(row.getByText('Sexual and/or Physical Abuse coverage is prohibited', { exact: false })).not.toBeVisible();
  });

  test('Q13 chain: Yes → Q13.1 → Yes → Q13.1.1 → Yes, No on Q13 → sub-questions disappear', async ({ page }) => {
    await selectQualifyingAnswer(page, 'Multiple named insured and/or joint venture', 'Yes');
    await expect(page.getByText('common ownership between the parties', { exact: false })).toBeVisible({ timeout: 10000 });

    await selectQualifyingAnswer(page, 'common ownership between the parties', 'Yes');
    await expect(page.getByText('insurable interest', { exact: false })).toBeVisible({ timeout: 10000 });

    await selectQualifyingAnswer(page, 'insurable interest', 'Yes');

    await selectQualifyingAnswer(page, 'Multiple named insured and/or joint venture', 'No');
    await expect(page.getByText('common ownership between the parties', { exact: false })).not.toBeVisible();
  });

  test('Q14 - Sales $25M: Yes → Submit message, No → clears', async ({ page }) => {
    await selectQualifyingAnswer(page, 'Sales or receipts of $25 million', 'Yes');
    await validateMessage(page, 'Sales or receipts of $25 million', 'Submit');
    await selectQualifyingAnswer(page, 'Sales or receipts of $25 million', 'No');
    const row14 = page.locator('tr').filter({ hasText: 'Sales or receipts of $25 million' }).first();
    await expect(row14.getByText('Submit', { exact: false })).not.toBeVisible();
    await expect(row14.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('Q15 - Gross income $150M: Yes → Submit message, No → clears', async ({ page }) => {
    await selectQualifyingAnswer(page, 'Gross income greater than $150 million', 'Yes');
    await expect(page.locator('#policyLevelQQTbl').getByText('Submit', { exact: false })).toBeVisible({ timeout: 15000 });
    await selectQualifyingAnswer(page, 'Gross income greater than $150 million', 'No');
    const row15 = page.locator('tr').filter({ hasText: 'Gross income greater than $150 million' }).first();
    await expect(row15.getByText('Submit', { exact: false })).not.toBeVisible();
    await expect(row15.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('Final state - all QQs (including sub-questions) set to No before form proceeds', async ({ page }) => {
    // Q1
    await selectQualifyingAnswer(page, 'Gas, oil or chemical plant operations', 'No');

    // Q2 + Q2.1 sub-question
    await selectQualifyingAnswer(page, 'Marijuana/Cannabis or Kava exposures', 'Yes');
    await expect(page.getByText('Is the exposure LRO?', { exact: false })).toBeVisible({ timeout: 10000 });
    await selectQualifyingAnswer(page, 'Is the exposure LRO?', 'No');
    await selectQualifyingAnswer(page, 'Marijuana/Cannabis or Kava exposures', 'No');
    await expect(page.getByText('Is the exposure LRO?', { exact: false })).not.toBeVisible();

    // Q3 - Q12
    await selectQualifyingAnswer(page, 'new residential condominium or townhouse', 'No');
    await selectQualifyingAnswer(page, 'Boys or Girls Club of America', 'No');
    await selectQualifyingAnswer(page, 'construction of more than 20 new residential homes', 'No');
    await selectQualifyingAnswer(page, 'Discontinued Products/Completed Operations', 'No');
    await selectQualifyingAnswer(page, 'hydraulic fracturing or hydrofracking', 'No');
    await selectQualifyingAnswer(page, 'Bar or Tavern', 'No');
    await selectQualifyingAnswer(page, 'A&B loss in the past 3 years', 'No');
    await selectQualifyingAnswer(page, 'animal related losses in past 3 years', 'No');
    await selectQualifyingAnswer(page, 'General Liability losses or a paid or reserved loss exceeding $25,000', 'No');
    await selectQualifyingAnswer(page, 'Sexual and/or Physical Abuse related losses', 'No');

    // Q13 + Q13.1 + Q13.1.1 sub-questions
    await selectQualifyingAnswer(page, 'Multiple named insured and/or joint venture', 'Yes');
    await expect(page.getByText('common ownership between the parties', { exact: false })).toBeVisible({ timeout: 10000 });
    await selectQualifyingAnswer(page, 'common ownership between the parties', 'Yes');
    await expect(page.getByText('insurable interest', { exact: false })).toBeVisible({ timeout: 10000 });
    await selectQualifyingAnswer(page, 'insurable interest', 'No');
    await selectQualifyingAnswer(page, 'common ownership between the parties', 'No');
    await selectQualifyingAnswer(page, 'Multiple named insured and/or joint venture', 'No');
    await expect(page.getByText('common ownership between the parties', { exact: false })).not.toBeVisible();

    // Q14 - Q15
    await selectQualifyingAnswer(page, 'Sales or receipts of $25 million', 'No');
    await selectQualifyingAnswer(page, 'Gross income greater than $150 million', 'No');

    // Verify all messages cleared and sub-questions hidden
    await expect(page.locator('tr').filter({ hasText: 'Gas, oil or chemical plant operations' }).first().getByText('Prohibited', { exact: false })).not.toBeVisible();
    await expect(page.getByText('Is the exposure LRO?', { exact: false })).not.toBeVisible();
    await expect(page.locator('tr').filter({ hasText: 'new residential condominium or townhouse' }).first().getByText('Prohibited', { exact: false })).not.toBeVisible();
    await expect(page.locator('tr').filter({ hasText: 'Boys or Girls Club of America' }).first().getByText('Prohibited', { exact: false })).not.toBeVisible();
    await expect(page.locator('tr').filter({ hasText: 'construction of more than 20 new residential homes' }).first().getByText('Prohibited', { exact: false })).not.toBeVisible();
    await expect(page.locator('tr').filter({ hasText: 'Discontinued Products/Completed Operations' }).first().getByText('Prohibited', { exact: false })).not.toBeVisible();
    await expect(page.locator('tr').filter({ hasText: 'hydraulic fracturing or hydrofracking' }).first().getByText('Prohibited', { exact: false })).not.toBeVisible();
    await expect(page.locator('tr').filter({ hasText: 'Bar or Tavern' }).first().getByText('Prohibited', { exact: false })).not.toBeVisible();
    await expect(page.locator('tr').filter({ hasText: 'A&B loss in the past 3 years' }).first().getByText('A&B coverage is prohibited', { exact: false })).not.toBeVisible();
    await expect(page.locator('tr').filter({ hasText: 'animal related losses in past 3 years' }).first().getByText('Animal Liability coverage is prohibited', { exact: false })).not.toBeVisible();
    await expect(page.locator('tr').filter({ hasText: 'General Liability losses or a paid or reserved loss exceeding $25,000' }).first().getByText('Submit', { exact: false })).not.toBeVisible();
    await expect(page.locator('tr').filter({ hasText: 'Sexual and/or Physical Abuse related losses' }).first().getByText('Sexual and/or Physical Abuse coverage is prohibited', { exact: false })).not.toBeVisible();
    await expect(page.getByText('common ownership between the parties', { exact: false })).not.toBeVisible();
    await expect(page.locator('tr').filter({ hasText: 'Sales or receipts of $25 million' }).first().getByText('Submit', { exact: false })).not.toBeVisible();
    await expect(page.locator('tr').filter({ hasText: 'Gross income greater than $150 million' }).first().getByText('Submit', { exact: false })).not.toBeVisible();
  });
});

// ─── Helpers: Common LOB Level - Qualifying Questions ─────────────────────────

async function selectCommonLobAnswer(page: Page, questionText: string, answer: 'Yes' | 'No'): Promise<void> {
  const row = page.locator('#policyLevelQQTbl2 tr').filter({ hasText: questionText }).first();
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const label = row.locator('label').filter({ hasText: answer });
  await label.waitFor({ state: 'visible', timeout: 10000 });
  await label.click();
  await page.waitForTimeout(800);
}

async function validateCommonLobMessage(page: Page, questionText: string, expectedMessage: string): Promise<void> {
  const row = page.locator('#policyLevelQQTbl2 tr').filter({ hasText: questionText }).first();
  await expect(row.getByText(expectedMessage, { exact: false })).toBeVisible({ timeout: 10000 });
}

// ─── Common LOB Level - Qualifying Questions Tests ────────────────────────────

test.describe('Common LOB Level - Qualifying Questions', () => {
  test.beforeAll(async ({ page }) => {
    await page.locator('#policyLevelQQTbl2').scrollIntoViewIfNeeded();
    await page.locator('#policyLevelQQTbl2').waitFor({ state: 'visible', timeout: 30000 });
  });

  test('CQ1 - Bankruptcy: Yes → Prohibited, No → clears', async ({ page }) => {
    await selectCommonLobAnswer(page, 'Risk in bankruptcy or receivership', 'Yes');
    await validateCommonLobMessage(page, 'Risk in bankruptcy or receivership', 'Prohibited');
    await selectCommonLobAnswer(page, 'Risk in bankruptcy or receivership', 'No');
    const row = page.locator('#policyLevelQQTbl2 tr').filter({ hasText: 'Risk in bankruptcy or receivership' }).first();
    await expect(row.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('CQ2 - Aluminum wiring: Yes → Prohibited, No → clears', async ({ page }) => {
    await selectCommonLobAnswer(page, 'Aluminum wiring', 'Yes');
    await validateCommonLobMessage(page, 'Aluminum wiring', 'Prohibited');
    await selectCommonLobAnswer(page, 'Aluminum wiring', 'No');
    const row = page.locator('#policyLevelQQTbl2 tr').filter({ hasText: 'Aluminum wiring' }).first();
    await expect(row.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('CQ3 - Business 3+ years: No → Loss Free Credit Prohibited, Yes → clears', async ({ page }) => {
    await selectCommonLobAnswer(page, 'Has the insured been in business for 3 or more years', 'No');
    await validateCommonLobMessage(page, 'Has the insured been in business for 3 or more years', 'Loss Free Credit Prohibited');
    await selectCommonLobAnswer(page, 'Has the insured been in business for 3 or more years', 'Yes');
    const row = page.locator('#policyLevelQQTbl2 tr').filter({ hasText: 'Has the insured been in business for 3 or more years' }).first();
    await expect(row.getByText('Loss Free Credit Prohibited', { exact: false })).not.toBeVisible();
  });

  test('CQ4 - Lapse in coverage: Yes → sub-questions appear + auto-enables + mutual exclusion on checkboxes, No → sub-questions disappear', async ({ page }) => {
    const tbl = page.locator('#policyLevelQQTbl2');
    await selectCommonLobAnswer(page, 'Has there been a lapse in coverage', 'Yes');

    // Verify 4.1 appears with message and Yes auto-enabled
    const row41 = tbl.locator('tr').filter({ hasText: 'Number of days?' }).first();
    await expect(row41).toBeVisible({ timeout: 10000 });
    await expect(row41.getByText('Signed No Known Loss Letter Required', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(row41.locator('input[type="radio"][value="1"]')).toBeChecked();

    // Verify 4.1.1 - 4.1.5 rows appear
    await expect(tbl.locator('tr').filter({ hasText: '1-30 days' }).first()).toBeVisible({ timeout: 10000 });
    await expect(tbl.locator('tr').filter({ hasText: '31 days up to and including 90 days' }).first()).toBeVisible({ timeout: 10000 });
    await expect(tbl.locator('tr').filter({ hasText: '91 days up to and including 180 days' }).first()).toBeVisible({ timeout: 10000 });
    await expect(tbl.locator('tr').filter({ hasText: '181 days up to and including 365 days' }).first()).toBeVisible({ timeout: 10000 });
    await expect(tbl.locator('tr').filter({ hasText: '366 days or more' }).first()).toBeVisible({ timeout: 10000 });

    // Click 4.1.1 checkbox → verify checked, Yes auto-enables, 4.1.2 becomes disabled
    const row411 = tbl.locator('tr').filter({ hasText: '1-30 days' }).first();
    await row411.locator('input.form-check-input').click();
    await expect(row411.locator('input.form-check-input')).toBeChecked();
    await expect(row411.locator('input[type="radio"][value="1"]')).toBeChecked();
    const row412 = tbl.locator('tr').filter({ hasText: '31 days up to and including 90 days' }).first();
    await expect(row412.locator('input.form-check-input')).toBeDisabled();

    // Uncheck 4.1.1 → 4.1.2 re-enables, then click 4.1.2 (mutual exclusion verified)
    await row411.locator('input.form-check-input').click();
    await expect(row411.locator('input.form-check-input')).not.toBeChecked();
    await expect(row412.locator('input.form-check-input')).toBeEnabled();
    await row412.locator('input.form-check-input').click();
    await expect(row412.locator('input.form-check-input')).toBeChecked();
    await expect(row411.locator('input.form-check-input')).toBeDisabled();

    // QQ4 = No → sub-questions disappear
    await selectCommonLobAnswer(page, 'Has there been a lapse in coverage', 'No');
    await expect(tbl.locator('tr').filter({ hasText: 'Number of days?' }).first()).not.toBeVisible();
  });

  test('CQ5 - Sinkhole losses: Yes → Submit, No → clears', async ({ page }) => {
    await selectCommonLobAnswer(page, 'Any Prior Sinkhole Losses', 'Yes');
    await validateCommonLobMessage(page, 'Any Prior Sinkhole Losses', 'Submit');
    await selectCommonLobAnswer(page, 'Any Prior Sinkhole Losses', 'No');
    const row = page.locator('#policyLevelQQTbl2 tr').filter({ hasText: 'Any Prior Sinkhole Losses' }).first();
    await expect(row.getByText('Submit', { exact: false })).not.toBeVisible();
  });

  test('CQ6 - New Venture: Yes → NKLL message, No → clears', async ({ page }) => {
    await selectCommonLobAnswer(page, 'New Venture', 'Yes');
    await validateCommonLobMessage(page, 'New Venture', 'Signed NKLL as of the date of our policy quote/inception date is required');
    await selectCommonLobAnswer(page, 'New Venture', 'No');
    const row = page.locator('#policyLevelQQTbl2 tr').filter({ hasText: 'New Venture' }).first();
    await expect(row.getByText('Signed NKLL as of the date of our policy quote/inception date is required', { exact: false })).not.toBeVisible();
  });

  test('Final state - all Common LOB QQs set to No before form proceeds', async ({ page }) => {
    const tbl = page.locator('#policyLevelQQTbl2');
    await selectCommonLobAnswer(page, 'Risk in bankruptcy or receivership', 'No');
    await selectCommonLobAnswer(page, 'Aluminum wiring', 'No');
    await selectCommonLobAnswer(page, 'Has the insured been in business for 3 or more years', 'Yes');
    await selectCommonLobAnswer(page, 'Has there been a lapse in coverage', 'No');
    await expect(tbl.locator('tr').filter({ hasText: 'Number of days?' }).first()).not.toBeVisible();
    await selectCommonLobAnswer(page, 'Any Prior Sinkhole Losses', 'No');
    await selectCommonLobAnswer(page, 'New Venture', 'No');

    // Verify final state
    await expect(tbl.locator('tr').filter({ hasText: 'Risk in bankruptcy or receivership' }).first().getByText('Prohibited', { exact: false })).not.toBeVisible();
    await expect(tbl.locator('tr').filter({ hasText: 'Aluminum wiring' }).first().getByText('Prohibited', { exact: false })).not.toBeVisible();
    await expect(tbl.locator('tr').filter({ hasText: 'Has the insured been in business for 3 or more years' }).first().getByText('Loss Free Credit Prohibited', { exact: false })).not.toBeVisible();
    await expect(tbl.locator('tr').filter({ hasText: 'Number of days?' }).first()).not.toBeVisible();
    await expect(tbl.locator('tr').filter({ hasText: 'Any Prior Sinkhole Losses' }).first().getByText('Submit', { exact: false })).not.toBeVisible();
    await expect(tbl.locator('tr').filter({ hasText: 'New Venture' }).first().getByText('Signed NKLL', { exact: false })).not.toBeVisible();
  });
});

// ─── GL Deductible Section ────────────────────────────────────────────────────

test.describe('GL Deductible Section', () => {
  test.beforeAll(async ({ page }) => {
    await page.locator('#glDeductibleRadioBtn').scrollIntoViewIfNeeded();
    await page.locator('#glDeductibleRadioBtn').waitFor({ state: 'visible', timeout: 30000 });
  });

  test('Deductible checkbox → auto-ticks 3 coverage types, select 2500 in dropdown', async ({ page }) => {
    await page.locator('#glDeductibleRadioBtn').scrollIntoViewIfNeeded();
    await page.locator('#glDeductibleRadioBtn').click();
    await expect(page.locator('#bodilyInj')).toBeChecked();
    await expect(page.locator('#propDam')).toBeChecked();
    await expect(page.locator('#persAdv')).toBeChecked();
    await page.locator('#generalSirDeductible').selectOption('2500');
    await expect(page.locator('#generalSirDeductible')).toHaveValue('2500');
  });
});

// ─── Class Code And Risk Builder ──────────────────────────────────────────────

test.describe('Class Code And Risk Builder', () => {
  test.beforeAll(async ({ page }) => {
    await page.locator('input.glClassCodeBuilder[placeholder="Class Code"]').scrollIntoViewIfNeeded();
    await page.locator('input.glClassCodeBuilder[placeholder="Class Code"]').waitFor({ state: 'visible', timeout: 30000 });
  });

  test('Fill class code, zip, address and click Add', async ({ page }) => {
    // Class code — typeahead selection
    await page.locator('input.glClassCodeBuilder[placeholder="Class Code"]').click();
    await page.locator('input.glClassCodeBuilder[placeholder="Class Code"]').pressSequentially(testData[0].classCode, { delay: 100 });
    await page.locator('.simple-typeahead-list-item').first().waitFor({ state: 'visible', timeout: 120000 });
    await page.locator('.simple-typeahead-list-item').first().evaluate(el => (el as HTMLElement).click());
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Zip code — typeahead selection
    await page.locator('input.creatorZipVal').click();
    await page.locator('input.creatorZipVal').pressSequentially(testData[0].classCodeZip, { delay: 100 });
    await page.locator('.simple-typeahead-list-item').first().waitFor({ state: 'visible', timeout: 120000 });
    await page.locator('.simple-typeahead-list-item').first().evaluate(el => (el as HTMLElement).click());
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Address — direct fill
    await page.locator('input.glAddressInput').fill(testData[0].classCodeAddress);
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Wait for Add button to be enabled (Bootstrap disabled class removed) then click
    await page.locator('button.classBuilderAddBtnDesign:not(.disabled)').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('button.classBuilderAddBtnDesign').click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  });
});

// ─── Helpers: RISK Level - Qualifying Questions ───────────────────────────────

async function selectRiskLevelAnswer(page: Page, questionText: string, answer: 'Yes' | 'No'): Promise<void> {
  const row = page.locator('#riskLevelQQTbl tr').filter({ hasText: questionText }).first();
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const label = row.locator('label').filter({ hasText: answer });
  await label.waitFor({ state: 'visible', timeout: 10000 });
  await label.click();
  await page.waitForTimeout(800);
}

async function validateRiskLevelMessage(page: Page, questionText: string, expectedMessage: string): Promise<void> {
  const row = page.locator('#riskLevelQQTbl tr').filter({ hasText: questionText }).first();
  await expect(row.getByText(expectedMessage, { exact: false })).toBeVisible({ timeout: 10000 });
}

// ─── Location and Risk Details ────────────────────────────────────────────────

test.describe('Location and Risk Details', () => {
  test.beforeAll(async ({ page }) => {
    await page.locator('#gllocationTable').waitFor({ state: 'visible', timeout: 30000 });
  });

  test('Verify L1 location row appears in table', async ({ page }) => {
    await expect(page.locator('#gllocationTable').getByText('L1')).toBeVisible({ timeout: 10000 });
  });

  test('Fill crime index and exposure → verify final rate and premium calculated', async ({ page }) => {
    // Fill Crime Index
    await page.locator('input#classBuilderCrimeIndex').scrollIntoViewIfNeeded();
    await page.locator('input#classBuilderCrimeIndex').fill(testData[0].crimeIndex);
    await page.waitForTimeout(500);

    // Fill Exposure Amount then tab out to trigger calculation
    await page.locator('input#exposureAmountInput').fill(testData[0].exposureAmount);
    await page.keyboard.press('Tab');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // Verify Final Rate is calculated (not empty)
    await expect(page.locator('input#classBuilderFinalRate')).not.toHaveValue('');

    // Verify Final Premium is calculated (not empty)
    await expect(page.locator('input#classBuilderPremium')).not.toHaveValue('');
  });
});

// ─── RISK Level - Qualifying Questions ───────────────────────────────────────

test.describe('RISK Level - Qualifying Questions', () => {
  test.beforeAll(async ({ page }) => {
    await page.locator('#riskLevelQQTbl').scrollIntoViewIfNeeded();
    await page.locator('#riskLevelQQTbl').waitFor({ state: 'visible', timeout: 30000 });
  });

  test('RQ1 - Liability losses: Yes → Prohibited, No → clears', async ({ page }) => {
    await selectRiskLevelAnswer(page, 'Any Liability losses in the past 3 years', 'Yes');
    await validateRiskLevelMessage(page, 'Any Liability losses in the past 3 years', 'Prohibited');
    await selectRiskLevelAnswer(page, 'Any Liability losses in the past 3 years', 'No');
    const row = page.locator('#riskLevelQQTbl tr').filter({ hasText: 'Any Liability losses in the past 3 years' }).first();
    await expect(row.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('RQ2 - Cooperative housing: Yes → Prohibited, No → clears', async ({ page }) => {
    await selectRiskLevelAnswer(page, 'Any cooperative housing associations not fully developed', 'Yes');
    await validateRiskLevelMessage(page, 'Any cooperative housing associations not fully developed', 'Prohibited');
    await selectRiskLevelAnswer(page, 'Any cooperative housing associations not fully developed', 'No');
    const row = page.locator('#riskLevelQQTbl tr').filter({ hasText: 'Any cooperative housing associations not fully developed' }).first();
    await expect(row.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('RQ3 - More than 250 units: Yes → Prohibited, No → clears', async ({ page }) => {
    await selectRiskLevelAnswer(page, 'more than 250 units/doors per location', 'Yes');
    await validateRiskLevelMessage(page, 'more than 250 units/doors per location', 'Prohibited');
    await selectRiskLevelAnswer(page, 'more than 250 units/doors per location', 'No');
    const row = page.locator('#riskLevelQQTbl tr').filter({ hasText: 'more than 250 units/doors per location' }).first();
    await expect(row.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('RQ4 - More than 5 locations: Yes → Prohibited, No → clears', async ({ page }) => {
    await selectRiskLevelAnswer(page, 'more than 5 locations and/or 1000 units', 'Yes');
    await validateRiskLevelMessage(page, 'more than 5 locations and/or 1000 units', 'Prohibited');
    await selectRiskLevelAnswer(page, 'more than 5 locations and/or 1000 units', 'No');
    const row = page.locator('#riskLevelQQTbl tr').filter({ hasText: 'more than 5 locations and/or 1000 units' }).first();
    await expect(row.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('RQ5 - Emergency shelter: Yes → Prohibited, No → clears', async ({ page }) => {
    await selectRiskLevelAnswer(page, 'Temporary emergency shelter or medical housing provided to occupants', 'Yes');
    await validateRiskLevelMessage(page, 'Temporary emergency shelter or medical housing provided to occupants', 'Prohibited');
    await selectRiskLevelAnswer(page, 'Temporary emergency shelter or medical housing provided to occupants', 'No');
    const row = page.locator('#riskLevelQQTbl tr').filter({ hasText: 'Temporary emergency shelter or medical housing provided to occupants' }).first();
    await expect(row.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('RQ6 - Sororities/fraternities: Yes → Prohibited, No → clears', async ({ page }) => {
    await selectRiskLevelAnswer(page, 'Sororities or fraternities exposure', 'Yes');
    await validateRiskLevelMessage(page, 'Sororities or fraternities exposure', 'Prohibited');
    await selectRiskLevelAnswer(page, 'Sororities or fraternities exposure', 'No');
    const row = page.locator('#riskLevelQQTbl tr').filter({ hasText: 'Sororities or fraternities exposure' }).first();
    await expect(row.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('RQ7 - Call buttons/pull cords: Yes → Prohibited, No → clears', async ({ page }) => {
    await selectRiskLevelAnswer(page, 'Any call buttons and/or pull cords for emergency assistance', 'Yes');
    await validateRiskLevelMessage(page, 'Any call buttons and/or pull cords for emergency assistance', 'Prohibited');
    await selectRiskLevelAnswer(page, 'Any call buttons and/or pull cords for emergency assistance', 'No');
    const row = page.locator('#riskLevelQQTbl tr').filter({ hasText: 'Any call buttons and/or pull cords for emergency assistance' }).first();
    await expect(row.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('RQ8 - Diving boards: Yes → Prohibited, No → clears', async ({ page }) => {
    await selectRiskLevelAnswer(page, 'Any diving boards or platforms', 'Yes');
    await validateRiskLevelMessage(page, 'Any diving boards or platforms', 'Prohibited');
    await selectRiskLevelAnswer(page, 'Any diving boards or platforms', 'No');
    const row = page.locator('#riskLevelQQTbl tr').filter({ hasText: 'Any diving boards or platforms' }).first();
    await expect(row.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('RQ9 - Unfenced pools: Yes → Prohibited, No → clears', async ({ page }) => {
    await selectRiskLevelAnswer(page, 'Any unfenced pools and/or pool without self-latching gates', 'Yes');
    await validateRiskLevelMessage(page, 'Any unfenced pools and/or pool without self-latching gates', 'Prohibited');
    await selectRiskLevelAnswer(page, 'Any unfenced pools and/or pool without self-latching gates', 'No');
    const row = page.locator('#riskLevelQQTbl tr').filter({ hasText: 'Any unfenced pools and/or pool without self-latching gates' }).first();
    await expect(row.getByText('Prohibited', { exact: false })).not.toBeVisible();
  });

  test('RQ10 - Student housing: Yes → Submit, No → clears', async ({ page }) => {
    await selectRiskLevelAnswer(page, 'Student housing?', 'Yes');
    await validateRiskLevelMessage(page, 'Student housing?', 'Submit');
    await selectRiskLevelAnswer(page, 'Student housing?', 'No');
    const row = page.locator('#riskLevelQQTbl tr').filter({ hasText: 'Student housing?' }).first();
    await expect(row.getByText('Submit', { exact: false })).not.toBeVisible();
  });

  test('RQ11 - 50% student housing: Yes → Rate Mod 1.15 Applied, No → clears', async ({ page }) => {
    await selectRiskLevelAnswer(page, 'Is occupany 50% or more student housing', 'Yes');
    await validateRiskLevelMessage(page, 'Is occupany 50% or more student housing', 'Rate Mod of 1.15 is Applied');
    await selectRiskLevelAnswer(page, 'Is occupany 50% or more student housing', 'No');
    const row = page.locator('#riskLevelQQTbl tr').filter({ hasText: 'Is occupany 50% or more student housing' }).first();
    await expect(row.getByText('Rate Mod of 1.15 is Applied', { exact: false })).not.toBeVisible();
  });

  test('Final state - all RISK Level QQs set to No', async ({ page }) => {
    await selectRiskLevelAnswer(page, 'Any Liability losses in the past 3 years', 'No');
    await selectRiskLevelAnswer(page, 'Any cooperative housing associations not fully developed', 'No');
    await selectRiskLevelAnswer(page, 'more than 250 units/doors per location', 'No');
    await selectRiskLevelAnswer(page, 'more than 5 locations and/or 1000 units', 'No');
    await selectRiskLevelAnswer(page, 'Temporary emergency shelter or medical housing provided to occupants', 'No');
    await selectRiskLevelAnswer(page, 'Sororities or fraternities exposure', 'No');
    await selectRiskLevelAnswer(page, 'Any call buttons and/or pull cords for emergency assistance', 'No');
    await selectRiskLevelAnswer(page, 'Any diving boards or platforms', 'No');
    await selectRiskLevelAnswer(page, 'Any unfenced pools and/or pool without self-latching gates', 'No');
    await selectRiskLevelAnswer(page, 'Student housing?', 'No');
    await selectRiskLevelAnswer(page, 'Is occupany 50% or more student housing', 'No');

    // Verify all messages cleared
    const tbl = page.locator('#riskLevelQQTbl');
    await expect(tbl.locator('tr').filter({ hasText: 'Any Liability losses in the past 3 years' }).first().getByText('Prohibited', { exact: false })).not.toBeVisible();
    await expect(tbl.locator('tr').filter({ hasText: 'Any cooperative housing associations not fully developed' }).first().getByText('Prohibited', { exact: false })).not.toBeVisible();
    await expect(tbl.locator('tr').filter({ hasText: 'more than 250 units/doors per location' }).first().getByText('Prohibited', { exact: false })).not.toBeVisible();
    await expect(tbl.locator('tr').filter({ hasText: 'more than 5 locations and/or 1000 units' }).first().getByText('Prohibited', { exact: false })).not.toBeVisible();
    await expect(tbl.locator('tr').filter({ hasText: 'Temporary emergency shelter or medical housing provided to occupants' }).first().getByText('Prohibited', { exact: false })).not.toBeVisible();
    await expect(tbl.locator('tr').filter({ hasText: 'Sororities or fraternities exposure' }).first().getByText('Prohibited', { exact: false })).not.toBeVisible();
    await expect(tbl.locator('tr').filter({ hasText: 'Any call buttons and/or pull cords for emergency assistance' }).first().getByText('Prohibited', { exact: false })).not.toBeVisible();
    await expect(tbl.locator('tr').filter({ hasText: 'Any diving boards or platforms' }).first().getByText('Prohibited', { exact: false })).not.toBeVisible();
    await expect(tbl.locator('tr').filter({ hasText: 'Any unfenced pools and/or pool without self-latching gates' }).first().getByText('Prohibited', { exact: false })).not.toBeVisible();
    await expect(tbl.locator('tr').filter({ hasText: 'Student housing?' }).first().getByText('Submit', { exact: false })).not.toBeVisible();
    await expect(tbl.locator('tr').filter({ hasText: 'Is occupany 50% or more student housing' }).first().getByText('Rate Mod of 1.15 is Applied', { exact: false })).not.toBeVisible();
  });
});

// ─── L1 - Add Risk 2 ─────────────────────────────────────────────────────────

test.describe('L1 - Add Risk 2', () => {
  test.beforeAll(async ({ page }) => {
    await page.locator('#gllocationTable #addRisk').waitFor({ state: 'visible', timeout: 30000 });
  });

  test('Click Add Risk and fill R2 class code via typeahead', async ({ page }) => {
    await page.locator('#gllocationTable #addRisk').scrollIntoViewIfNeeded();
    await page.locator('#gllocationTable #addRisk').click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.locator('input.glClassCodeBuilder[placeholder="Class Code"]').click();
    await page.locator('input.glClassCodeBuilder[placeholder="Class Code"]').pressSequentially(testData[0].r2ClassCode, { delay: 100 });
    await page.locator('.simple-typeahead-list-item').first().waitFor({ state: 'visible', timeout: 120000 });
    await page.locator('.simple-typeahead-list-item').first().evaluate(el => (el as HTMLElement).click());
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.pause();
    await page.locator('button.classBuilderAddBtnDesign:not(.disabled)').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('button.classBuilderAddBtnDesign').click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  });

  test('Verify L1R2 appears in location table', async ({ page }) => {
    await expect(page.locator('#gllocationTable').getByText('R2')).toBeVisible({ timeout: 10000 });
  });

  test('Fill R2 exposure amount and verify final rate and premium calculated', async ({ page }) => {
    await page.locator('input#exposureAmountInput').last().scrollIntoViewIfNeeded();
    await page.locator('input#exposureAmountInput').last().fill(testData[0].r2ExposureAmount);
    await page.keyboard.press('Tab');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(1000);
    await expect(page.locator('input#classBuilderFinalRate').last()).not.toHaveValue('');
    await expect(page.locator('input#classBuilderPremium').last()).not.toHaveValue('');
  });
});

// ─── Location 2 - Add and Fill ────────────────────────────────────────────────

test.describe('Location 2 - Add and Fill', () => {
  test.beforeAll(async ({ page }) => {
    await page.locator('input.glClassCodeBuilder[placeholder="Class Code"]').waitFor({ state: 'visible', timeout: 30000 });
  });

  test('Add L2 class code, zip, address and click Add', async ({ page }) => {
    await page.locator('input.glClassCodeBuilder[placeholder="Class Code"]').click();
    await page.locator('input.glClassCodeBuilder[placeholder="Class Code"]').pressSequentially(testData[0].l2ClassCode, { delay: 100 });
    await page.locator('.simple-typeahead-list-item').first().waitFor({ state: 'visible', timeout: 120000 });
    await page.locator('.simple-typeahead-list-item').first().evaluate(el => (el as HTMLElement).click());
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    await page.locator('input.creatorZipVal').click();
    await page.locator('input.creatorZipVal').pressSequentially(testData[0].l2ClassCodeZip, { delay: 100 });
    await page.locator('.simple-typeahead-list-item').first().waitFor({ state: 'visible', timeout: 120000 });
    await page.locator('.simple-typeahead-list-item').first().evaluate(el => (el as HTMLElement).click());
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    await page.locator('input.glAddressInput').fill(testData[0].l2ClassCodeAddress);
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    await page.locator('button.classBuilderAddBtnDesign:not(.disabled)').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('button.classBuilderAddBtnDesign').click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  });

  test('Fill L2 crime index and exposure amount', async ({ page }) => {
    await page.locator('input#classBuilderCrimeIndex').last().scrollIntoViewIfNeeded();
    await page.locator('input#classBuilderCrimeIndex').last().fill(testData[0].l2crimeindex);
    await page.waitForTimeout(500);
    await page.locator('input#exposureAmountInput').last().fill(testData[0].l2ExposureAmount);
    await page.keyboard.press('Tab');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(1000);
    await expect(page.locator('input#classBuilderFinalRate').last()).not.toHaveValue('');
    await expect(page.locator('input#classBuilderPremium').last()).not.toHaveValue('');
  });

  test('Toggle If Any No → Yes to enable minimum premium for L2R1', async ({ page }) => {
    await page.locator('label[for*="glIfany"]').last().scrollIntoViewIfNeeded();
    await page.locator('label[for*="glIfany"]').last().click();
    await page.waitForTimeout(800);
    await expect(page.locator('input.minpremsystem').last()).toBeEnabled({ timeout: 10000 });
  });

  test('Fill L2R1 minimum premium', async ({ page }) => {
    await page.locator('input.minpremsystem').last().fill(testData[0].l2r1minimumpremium);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    await expect(page.locator('input.minpremsystem').last()).toHaveValue(testData[0].l2r1minimumpremium);
  });
});

// ─── Location 3 - Add and Fill ────────────────────────────────────────────────

test.describe('Location 3 - Add and Fill', () => {
  test.beforeAll(async ({ page }) => {
    await page.locator('input.glClassCodeBuilder[placeholder="Class Code"]').waitFor({ state: 'visible', timeout: 30000 });
  });

  test('Add L3 class code, zip, address and click Add', async ({ page }) => {
    await page.locator('input.glClassCodeBuilder[placeholder="Class Code"]').click();
    await page.locator('input.glClassCodeBuilder[placeholder="Class Code"]').pressSequentially(testData[0].l3classcode, { delay: 100 });
    await page.locator('.simple-typeahead-list-item').first().waitFor({ state: 'visible', timeout: 120000 });
    await page.locator('.simple-typeahead-list-item').first().evaluate(el => (el as HTMLElement).click());
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    await page.locator('input.creatorZipVal').click();
    await page.locator('input.creatorZipVal').pressSequentially(testData[0].l3classcodezip, { delay: 100 });
    await page.locator('.simple-typeahead-list-item').first().waitFor({ state: 'visible', timeout: 120000 });
    await page.locator('.simple-typeahead-list-item').first().evaluate(el => (el as HTMLElement).click());
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    await page.locator('input.glAddressInput').fill(testData[0].l3classcodeaddress);
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    await page.locator('button.classBuilderAddBtnDesign:not(.disabled)').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('button.classBuilderAddBtnDesign').click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  });

  test('Verify L3 appears in location table', async ({ page }) => {
    await expect(page.locator('#gllocationTable').getByText('L3')).toBeVisible({ timeout: 10000 });
  });

  test('Fill L3 crime index and exposure amount', async ({ page }) => {
    await page.locator('input#classBuilderCrimeIndex').last().scrollIntoViewIfNeeded();
    await page.locator('input#classBuilderCrimeIndex').last().fill(testData[0].l3crimeindex);
    await page.waitForTimeout(500);
    await page.locator('input#exposureAmountInput').last().fill(testData[0].l3classcodeexposure);
    await page.keyboard.press('Tab');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(1000);
    await expect(page.locator('input#classBuilderFinalRate').last()).not.toHaveValue('');
    await expect(page.locator('input#classBuilderPremium').last()).not.toHaveValue('');
  });
});

// ─── Location 4 - Add and Fill ────────────────────────────────────────────────

test.describe('Location 4 - Add and Fill', () => {
  test.beforeAll(async ({ page }) => {
    await page.locator('input.glClassCodeBuilder[placeholder="Class Code"]').waitFor({ state: 'visible', timeout: 30000 });
  });

  test('Add L4 class code, zip, address and click Add', async ({ page }) => {
    await page.locator('input.glClassCodeBuilder[placeholder="Class Code"]').click();
    await page.locator('input.glClassCodeBuilder[placeholder="Class Code"]').pressSequentially(testData[0].l4ClassCode, { delay: 100 });
    await page.locator('.simple-typeahead-list-item').first().waitFor({ state: 'visible', timeout: 120000 });
    await page.locator('.simple-typeahead-list-item').first().evaluate(el => (el as HTMLElement).click());
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    await page.locator('input.creatorZipVal').click();
    await page.locator('input.creatorZipVal').pressSequentially(testData[0].l4ClassCodeZip, { delay: 100 });
    await page.locator('.simple-typeahead-list-item').first().waitFor({ state: 'visible', timeout: 120000 });
    await page.locator('.simple-typeahead-list-item').first().evaluate(el => (el as HTMLElement).click());
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    await page.locator('input.glAddressInput').fill(testData[0].l4ClassCodeAddress);
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    await page.locator('button.classBuilderAddBtnDesign:not(.disabled)').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('button.classBuilderAddBtnDesign').click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  });

  test('Verify L4 in table and fill L4 exposure amount', async ({ page }) => {
    await expect(page.locator('#gllocationTable').getByText('L4')).toBeVisible({ timeout: 10000 });
    await page.locator('input#exposureAmountInput').last().scrollIntoViewIfNeeded();
    await page.locator('input#exposureAmountInput').last().fill(testData[0].l4classcodeexposure);
    await page.keyboard.press('Tab');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(1000);
    await expect(page.locator('input#classBuilderFinalRate').last()).not.toHaveValue('');
    await expect(page.locator('input#classBuilderPremium').last()).not.toHaveValue('');
  });

  test('Fill L4R1 override premium', async ({ page }) => {
    await page.locator('input#glOverrideModInput').last().scrollIntoViewIfNeeded();
    await page.locator('input#glOverrideModInput').last().fill(testData[0].l4OverridePremium);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    await expect(page.locator('input#glOverrideModInput').last()).toHaveValue(testData[0].l4OverridePremium);
  });
});
