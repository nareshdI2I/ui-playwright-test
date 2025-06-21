import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/demoqa/LoginPage';
import credentials from '../test-data/login-credentials.json' assert { type: 'json' };

// Extend the base test to create a new fixture.
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    const validUser = credentials.testCases.find(c => c.expectedResult === 'success');

    if (!validUser) {
      throw new Error('No valid user found in credentials file.');
    }

    // Perform the login using validateLogin for better error handling
    const loginResult = await loginPage.validateLogin(validUser);
    
    if (loginResult.actualResult !== 'success') {
      throw new Error(`Login failed: ${loginResult.errorMessage || 'Unknown error'}`);
    }

    // After successful login, wait for the profile page to be fully loaded
    await page.waitForURL('**/profile');
    
    // Wait for the profile header to be visible
    try {
      await page.waitForSelector('#userName-value', { state: 'visible', timeout: 10000 });
    } catch (error) {
      throw new Error('Profile page did not load correctly after login.');
    }
    
    // Use the authenticated page in the test.
    await use(page);
  },
});

export { expect } from '@playwright/test'; 