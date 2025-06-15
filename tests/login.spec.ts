import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Login Tests', () => {
    test('successful login', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const dashboardPage = new DashboardPage(page);

        // Navigate to login page
        await loginPage.navigateToLoginPage(process.env.BASE_URL || 'http://your-app-url');

        // Perform login
        await loginPage.login('validUsername', 'validPassword');

        // Verify dashboard is displayed
        expect(await dashboardPage.isDashboardDisplayed()).toBeTruthy();
        expect(await dashboardPage.getWelcomeMessage()).toContain('Welcome');
    });

    test('failed login with invalid credentials', async ({ page }) => {
        const loginPage = new LoginPage(page);

        // Navigate to login page
        await loginPage.navigateToLoginPage(process.env.BASE_URL || 'http://your-app-url');

        // Attempt login with invalid credentials
        await loginPage.login('invalidUsername', 'invalidPassword');

        // Verify error message
        const errorMessage = await loginPage.getErrorMessage();
        expect(errorMessage).toContain('Invalid credentials');
    });
}); 