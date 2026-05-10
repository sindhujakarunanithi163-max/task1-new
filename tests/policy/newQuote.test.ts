import { test, expect } from '../../fixtures/baseTest';

test('Verify user can navigate to New Quote page', async ({ loginPage, quotePage, envConfig, credentials }) => {
  await loginPage.goto(envConfig);
  await loginPage.loginAndVerify(credentials.username, credentials.password);
  await quotePage.simpleNavigateToNewQuote();
  await expect(quotePage.page).toHaveURL(/new-quote/);
});
