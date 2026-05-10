import { test as base, expect } from '@playwright/test';
import { getEnvConfig, getActiveEnv, EnvConfig } from '../config/env';
import { getCredentials, UserCredentials } from '../config/credentials';
import { LoginPage } from '../pages/LoginPage';
import { NewQuotePage } from '../pages/policyManagement/NewQuotePage';
import { NewQuoteFormPage } from '../pages/policyManagement/newquoteformpage';

interface Fixtures {
  envConfig: EnvConfig;
  credentials: UserCredentials;
  loginPage: LoginPage;
  quotePage: NewQuotePage;
  quoteFormPage: NewQuoteFormPage;
}

const test = base.extend<Fixtures>({
  envConfig: async ({}, use) => {
    await use(getEnvConfig());
  },

  credentials: async ({}, use) => {
    const env = getActiveEnv();
    await use(getCredentials(env, 'standard'));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  quotePage: async ({ page }, use) => {
    await use(new NewQuotePage(page));
  },

  quoteFormPage: async ({ page }, use) => {
    await use(new NewQuoteFormPage(page));
  },
});

export { test, expect };
