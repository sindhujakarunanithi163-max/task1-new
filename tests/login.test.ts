import { test } from '../fixtures/baseTest';

test('standard user can log in successfully', async ({ loginPage, envConfig, credentials }) => {
  await loginPage.goto(envConfig);
  await loginPage.loginAndVerify(credentials.username, credentials.password);
});
