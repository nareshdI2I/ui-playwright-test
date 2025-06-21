import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import credentials from '../test-data/login-credentials.json';

type AuthFixtures = {
  page: Page;
};

// Extend the base test to create a new fixture.
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    const validUser = credentials.testCases.find(c => c.expectedResult === 'success');

    if (!validUser) {
      throw new Error('No valid user found in credentials file.');
    }

    // Perform the login
    await loginPage.goto();
    await loginPage.login(validUser.username, validUser.password);

    // The test will now start from the page after login.
    // For DemoQA, this is the profile page, so we'll navigate to the main dashboard.
    await page.goto('/');

    // Explicitly wait for the element cards to be ready to ensure the page is interactive
    await page.locator('.card-body:has-text("Elements")').waitFor();

    // Use the authenticated page in the test.
    await use(page);
  },
});

export { expect } from '@playwright/test'; 