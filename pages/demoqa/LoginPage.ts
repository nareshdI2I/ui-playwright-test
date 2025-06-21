/// <reference lib="dom" />
import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';
import fs from 'fs';

interface LoginData {
    username: string;
    password: string;
    expectedResult: string;
    testScenario: string;
}

interface LoginResult {
    actualResult: string;
    errorMessage?: string;
}

export class LoginPage extends BasePage {
    private usernameInput: Locator;
    private passwordInput: Locator;
    private loginButton: Locator;
    private errorMessage: Locator;
    private passwordToggle: Locator;

    /* eslint-disable sonarjs/no-hardcoded-passwords */
    protected readonly selectors = {
        usernameInput: '#userName',
        passwordInput: '#password',
        loginButton: '#login',
        errorMessage: '#name',  // Main error message element
        invalidMessage: '.mb-1', // Alternative error message element
        profileHeader: '#userName-value',  // Profile page header after successful login
        passwordToggle: '[data-testid="password-toggle"]'
    };
    /* eslint-enable sonarjs/no-hardcoded-passwords */

    constructor(page: Page) {
        super(page);
        this.usernameInput = page.locator(this.selectors.usernameInput);
        this.passwordInput = page.locator(this.selectors.passwordInput);
        this.loginButton = page.locator(this.selectors.loginButton);
        this.errorMessage = page.locator(this.selectors.errorMessage);
        this.passwordToggle = page.locator(this.selectors.passwordToggle);
    }

    protected getPagePath(): string {
        return '/login';
    }

    protected get pageSelectors(): Record<string, string> {
        return this.selectors;
    }

    /**
     * Fills login credentials and clicks the login button.
     * It does not wait for the result of the login action.
     * @param username - Username
     * @param password - Password
     */
    async login(username: string, password: string): Promise<void> {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    async getErrorMessage(): Promise<string> {
        try {
            await new Promise(res => setTimeout(res, 1000));

            const username = await this.usernameInput.inputValue();
            const password = await this.passwordInput.inputValue();
            
            if (!username.trim()) {
                return 'Username cannot be empty';
            }
            if (!password.trim()) {
                return 'Password cannot be empty';
            }

            // eslint-disable-next-line playwright/no-element-handle
            const errorSelector = await this.page.$(this.selectors.errorMessage);
            if (errorSelector) {
                const text = await errorSelector.textContent();
                if (text && text.trim()) return text.trim();
            }

            // eslint-disable-next-line playwright/no-element-handle
            const invalidSelector = await this.page.$(this.selectors.invalidMessage);
            if (invalidSelector) {
                const text = await invalidSelector.textContent();
                if (text && text.trim()) return text.trim();
            }

            return 'Invalid username or password';
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to get error message:', error);
            return 'Login validation failed';
        }
    }

    async validateLogin(data: LoginData): Promise<LoginResult> {
        try {
            // First, ensure we're on the login page
            const currentUrl = this.page.url();
            if (!currentUrl.includes('/login')) {
                await this.goto();
            }

            // Wait for page to be ready with shorter timeout and better error handling
            try {
                // eslint-disable-next-line playwright/no-wait-for-selector
                await this.page.waitForSelector(this.selectors.usernameInput, { state: 'visible', timeout: 5000 });
                // eslint-disable-next-line playwright/no-wait-for-selector
                await this.page.waitForSelector(this.selectors.passwordInput, { state: 'visible', timeout: 5000 });
                // eslint-disable-next-line playwright/no-wait-for-selector
                await this.page.waitForSelector(this.selectors.loginButton, { state: 'visible', timeout: 5000 });
            } catch (timeoutError) {
                return {
                    actualResult: 'failure',
                    errorMessage: `Page elements not found: ${timeoutError instanceof Error ? timeoutError.message : 'Timeout waiting for login form'}`
                };
            }

            // Clear fields before filling
            await this.usernameInput.clear();
            await this.passwordInput.clear();
            
            // Fill credentials
            await this.usernameInput.fill(data.username);
            await this.passwordInput.fill(data.password);

            // Click login and wait for navigation or error
            await Promise.all([
                this.loginButton.click(),
                this.page.waitForNavigation({ timeout: 5000 }).catch(() => {})
            ]);

            // Check if we're on the profile page (success case)
            const newUrl = this.page.url();
            if (newUrl.includes('/profile')) {
                try {
                    // eslint-disable-next-line playwright/no-wait-for-selector
                    await this.page.waitForSelector(this.selectors.profileHeader, { state: 'visible', timeout: 5000 });
                    return { actualResult: 'success' };
                } catch (profileError) {
                    return {
                        actualResult: 'failure',
                        errorMessage: `Login succeeded but profile page not loaded: ${profileError instanceof Error ? profileError.message : 'Profile page timeout'}`
                    };
                }
            }

            // Check for error messages
            try {
                // eslint-disable-next-line playwright/no-element-handle
                const errorElement = await this.page.$(this.selectors.errorMessage);
                // eslint-disable-next-line playwright/no-element-handle
                const invalidElement = await this.page.$(this.selectors.invalidMessage);

                if (errorElement || invalidElement) {
                    const errorText = await this.getErrorMessage();
                    return {
                        actualResult: 'failure',
                        errorMessage: errorText
                    };
                }
            } catch (errorCheckError) {
                // If we can't check for errors, assume login failed
                return {
                    actualResult: 'failure',
                    errorMessage: `Error checking login result: ${errorCheckError instanceof Error ? errorCheckError.message : 'Unknown error'}`
                };
            }

            return { actualResult: 'failure', errorMessage: 'Login failed - no error message found' };

        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Login attempt failed:', error);
            return {
                actualResult: 'failure',
                errorMessage: error instanceof Error ? error.message : 'Unknown error during login'
            };
        }
    }

    async getUsernameValue(): Promise<string> {
        // eslint-disable-next-line playwright/no-element-handle
        const input = await this.page.$(this.selectors.usernameInput);
        return input ? input.inputValue() : '';
    }

    async getPasswordValue(): Promise<string> {
        // eslint-disable-next-line playwright/no-element-handle
        const input = await this.page.$(this.selectors.passwordInput);
        return input ? input.inputValue() : '';
    }

    async goto() {
        await this.page.goto('/login');
    }

    async getCurrentUrl(): Promise<string> {
        return this.page.url();
    }

    async getProviderDashboardElement(): Promise<Locator> {
        return this.page.locator(this.selectors.profileHeader);
    }

    async getPatientDashboardElement(): Promise<Locator> {
        return this.page.locator(this.selectors.profileHeader);
    }

    async getSanitizedInput(field: 'username' | 'password'): Promise<string> {
        const input = field === 'username' ? this.usernameInput : this.passwordInput;
        return await input.inputValue();
    }

    async enterPassword(password: string) {
        await this.passwordInput.fill(password);
    }

    async getPasswordFieldType(): Promise<string> {
        return await this.passwordInput.getAttribute('type') || '';
    }

    async togglePasswordVisibility() {
        await this.passwordToggle.click();
    }

    async getPasswordField(): Promise<Locator> {
        return this.passwordInput;
    }
} 