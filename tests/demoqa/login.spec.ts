import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../../pages/demoqa/LoginPage';
import * as loginData from '../../test-data/login-credentials.json' assert { type: 'json' };

test.describe('DemoQA Login Tests', () => {
    test('successful login', async ({ page }: { page: Page }) => {
        const loginPage = new LoginPage(page);

        // Navigate to login page
        await loginPage.goto();

        // Perform login
        const { username, password } = loginData.testCases[0];
        await loginPage.login(username, password);

        // Verify successful login
        await expect(page).toHaveURL(/profile/);
    });

    test('invalid login', async ({ page }: { page: Page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        const { username, password } = loginData.testCases[1];
        await loginPage.login(username, password);
        const errorMessage = await loginPage.getErrorMessage();
        expect(errorMessage).toContain('Invalid username or password');
    });
}); 