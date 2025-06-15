import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

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

    // Selectors specific to DemoQA login page
    protected readonly selectors = {
        usernameInput: '#userName',
        passwordInput: '#password',
        loginButton: '#login',
        errorMessage: '#name',  // Main error message element
        invalidMessage: '.mb-1', // Alternative error message element
        profileHeader: '#userName-value',  // Profile page header after successful login
        passwordToggle: '[data-testid="password-toggle"]'
    };

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
     * Attempts to login with the provided credentials
     * @param username - Username
     * @param password - Password
     * @returns Promise<boolean> - Whether the login was successful
     */
    async login(username: string, password: string): Promise<boolean> {
        try {
            // Wait for the page to be ready
            await this.page.waitForSelector(this.selectors.usernameInput, { state: 'visible', timeout: 10000 });
            await this.page.waitForSelector(this.selectors.passwordInput, { state: 'visible', timeout: 10000 });
            await this.page.waitForSelector(this.selectors.loginButton, { state: 'visible', timeout: 10000 });

            // Validate empty fields before attempting login
            if (!username.trim() || !password.trim()) {
                return false;
            }

            // Fill in credentials
            await this.usernameInput.fill(username);
            await this.passwordInput.fill(password);

            // Click login and wait for navigation or error
            await Promise.all([
                this.loginButton.click(),
                // Wait for either navigation or error message
                Promise.race([
                    this.page.waitForNavigation({ timeout: 5000 }).catch(() => {}),
                    this.page.waitForSelector(this.selectors.errorMessage, { timeout: 5000 }).catch(() => {}),
                    this.page.waitForSelector(this.selectors.invalidMessage, { timeout: 5000 }).catch(() => {})
                ])
            ]);

            // Check if we're on the profile page (success case)
            const currentUrl = this.page.url();
            if (currentUrl.includes('/profile')) {
                return true;
            }

            // Check for error messages
            const errorElement = await this.page.$(this.selectors.errorMessage);
            const invalidElement = await this.page.$(this.selectors.invalidMessage);

            // If either error element exists, login failed
            return !(errorElement || invalidElement);

        } catch (error) {
            console.error('Login attempt failed:', error);
            return false;
        }
    }

    /**
     * Gets the error message if present
     */
    async getErrorMessage(): Promise<string> {
        try {
            // Wait a bit for error messages to appear
            await this.page.waitForTimeout(1000);

            // For empty fields, return specific message
            const username = await this.page.$eval(this.selectors.usernameInput, el => (el as HTMLInputElement).value);
            const password = await this.page.$eval(this.selectors.passwordInput, el => (el as HTMLInputElement).value);
            
            if (!username.trim()) {
                return 'Username cannot be empty';
            }
            if (!password.trim()) {
                return 'Password cannot be empty';
            }

            // Check both error message locations
            const errorSelector = await this.page.$(this.selectors.errorMessage);
            if (errorSelector) {
                const text = await errorSelector.textContent();
                if (text && text.trim()) return text.trim();
            }

            const invalidSelector = await this.page.$(this.selectors.invalidMessage);
            if (invalidSelector) {
                const text = await invalidSelector.textContent();
                if (text && text.trim()) return text.trim();
            }

            // If no specific error message found
            return 'Invalid username or password';
        } catch (error) {
            console.error('Failed to get error message:', error);
            return 'Login validation failed';
        }
    }

    /**
     * Validates login with test data
     * @param data - Login test data
     * @returns Object containing test results
     */
    async validateLogin(data: LoginData): Promise<LoginResult> {
        try {
            // Wait for the page to be ready
            await this.page.waitForSelector(this.selectors.usernameInput, { state: 'visible', timeout: 10000 });
            await this.page.waitForSelector(this.selectors.passwordInput, { state: 'visible', timeout: 10000 });
            await this.page.waitForSelector(this.selectors.loginButton, { state: 'visible', timeout: 10000 });

            // Fill in credentials
            await this.usernameInput.fill(data.username);
            await this.passwordInput.fill(data.password);

            // Click login and wait for navigation
            await Promise.all([
                this.loginButton.click(),
                this.page.waitForNavigation({ timeout: 5000 }).catch(() => {})
            ]);

            // Check if we're on the profile page (success case)
            const currentUrl = this.page.url();
            if (currentUrl.includes('/profile')) {
                // Wait for the profile page to load completely
                await this.page.waitForSelector(this.selectors.profileHeader, { state: 'visible', timeout: 10000 });
                return { actualResult: 'success' };
            }

            // Check for error messages
            const errorElement = await this.page.$(this.selectors.errorMessage);
            const invalidElement = await this.page.$(this.selectors.invalidMessage);

            // If either error element exists, login failed
            if (errorElement || invalidElement) {
                const errorText = await this.getErrorMessage();
                return {
                    actualResult: 'failure',
                    errorMessage: errorText
                };
            }

            return { actualResult: 'failure', errorMessage: 'Unknown error' };

        } catch (error) {
            console.error('Login attempt failed:', error);
            return {
                actualResult: 'failure',
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Gets the current username field value
     */
    async getUsernameValue(): Promise<string> {
        const input = await this.page.$(this.selectors.usernameInput);
        return input ? input.inputValue() : '';
    }

    /**
     * Gets the current password field value
     */
    async getPasswordValue(): Promise<string> {
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