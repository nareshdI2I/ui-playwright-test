import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

test.describe('Sauce Demo Tests', () => {
    let loginPage: LoginPage;
    let inventoryPage: InventoryPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        inventoryPage = new InventoryPage(page);
    });

    test('should login successfully and perform inventory actions', async () => {
        // Navigate to login page
        await loginPage.navigateToLogin();

        // Login with valid credentials
        await loginPage.login('standard_user', 'secret_sauce');

        // Verify successful login by checking inventory page is loaded
        expect(await inventoryPage.isLoaded()).toBeTruthy();

        // Sort products by price high to low
        await inventoryPage.sortProducts('price_desc');

        // Add first two items to cart
        await inventoryPage.addItemToCart(0);
        await inventoryPage.addItemToCart(1);

        // Verify cart count
        expect(await inventoryPage.getCartItemCount()).toBe('2');

        // Get all product names and verify they exist
        const productNames = await inventoryPage.getAllProductNames();
        expect(productNames.length).toBeGreaterThan(0);
    });

    test('should show error message with invalid credentials', async () => {
        // Navigate to login page
        await loginPage.navigateToLogin();

        // Try to login with invalid credentials
        await loginPage.login('invalid_user', 'invalid_password');

        // Verify error message
        const errorMessage = await loginPage.getErrorMessage();
        expect(errorMessage).toContain('Username and password do not match');
    });
});
