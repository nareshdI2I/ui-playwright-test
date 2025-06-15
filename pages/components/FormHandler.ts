import { Page } from '@playwright/test';
import { TestUtils } from '../../utils/test-utils';

export class FormHandler {
    protected utils: TestUtils;

    constructor(protected page: Page) {
        this.utils = new TestUtils(page);
    }

    /**
     * Fill form field with retry logic
     */
    async fillField(selector: string, value: string, options = { timeout: 5000 }) {
        await this.utils.retryAction(async () => {
            const element = await this.page.waitForSelector(selector, {
                state: 'visible',
                timeout: options.timeout
            });
            await element.fill(value);
        });
    }

    /**
     * Select dropdown option
     */
    async selectOption(selector: string, value: string, options = { timeout: 5000 }) {
        await this.utils.retryAction(async () => {
            await this.page.selectOption(selector, value, {
                timeout: options.timeout
            });
        });
    }

    /**
     * Check/uncheck checkbox
     */
    async setCheckbox(selector: string, checked: boolean, options = { timeout: 5000 }) {
        await this.utils.retryAction(async () => {
            const checkbox = await this.page.waitForSelector(selector, {
                state: 'visible',
                timeout: options.timeout
            });
            await checkbox.setChecked(checked);
        });
    }

    /**
     * Get form field value
     */
    async getFieldValue(selector: string, options = { timeout: 5000 }): Promise<string> {
        return this.utils.retryAction(async () => {
            const element = await this.page.waitForSelector(selector, {
                state: 'visible',
                timeout: options.timeout
            });
            return element.inputValue();
        });
    }

    /**
     * Check if form field has error
     */
    async hasFieldError(fieldSelector: string, errorSelector: string): Promise<boolean> {
        try {
            await this.page.waitForSelector(errorSelector, {
                state: 'visible',
                timeout: 1000
            });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Submit form with validation
     */
    async submitForm(
        submitButtonSelector: string,
        options = {
            validateBeforeSubmit: true,
            waitForNavigation: true,
            timeout: 10000
        }
    ) {
        if (options.validateBeforeSubmit) {
            // Wait for form validation to complete
            await this.page.waitForTimeout(100);
        }

        await this.utils.retryAction(async () => {
            const button = await this.page.waitForSelector(submitButtonSelector, {
                state: 'visible',
                timeout: options.timeout
            });

            if (options.waitForNavigation) {
                await Promise.all([
                    this.page.waitForNavigation(),
                    button.click()
                ]);
            } else {
                await button.click();
            }
        });
    }

    /**
     * Clear form field
     */
    async clearField(selector: string, options = { timeout: 5000 }) {
        await this.utils.retryAction(async () => {
            const element = await this.page.waitForSelector(selector, {
                state: 'visible',
                timeout: options.timeout
            });
            await element.fill('');
        });
    }

    /**
     * Upload file
     */
    async uploadFile(selector: string, filePath: string, options = { timeout: 10000 }) {
        await this.utils.retryAction(async () => {
            const fileInput = await this.page.waitForSelector(selector, {
                state: 'visible',
                timeout: options.timeout
            });
            await fileInput.setInputFiles(filePath);
        });
    }
} 