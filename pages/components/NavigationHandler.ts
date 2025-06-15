import { Page } from '@playwright/test';
import { TestUtils } from '../../utils/test-utils';
import { config } from '../../config/env.config';

export class NavigationHandler {
    protected utils: TestUtils;

    constructor(protected page: Page) {
        this.utils = new TestUtils(page);
    }

    /**
     * Navigate to a specific path with smart waiting
     */
    async navigateTo(path: string, options = { waitForLoad: true }) {
        const url = new URL(path, config.baseUrl).toString();
        await this.page.goto(url);
        
        if (options.waitForLoad) {
            await this.waitForPageLoad();
        }
    }

    /**
     * Wait for page to be fully loaded
     */
    async waitForPageLoad() {
        await Promise.all([
            this.utils.waitForNetworkIdle(config.timeouts.navigation),
            this.utils.waitForLoadingToDisappear(),
            this.page.waitForLoadState('domcontentloaded')
        ]);
    }

    /**
     * Check if current URL matches expected path
     */
    async isCurrentPath(expectedPath: string): Promise<boolean> {
        const currentUrl = new URL(this.page.url());
        const expectedUrl = new URL(expectedPath, config.baseUrl);
        return currentUrl.pathname === expectedUrl.pathname;
    }

    /**
     * Get current page path
     */
    getCurrentPath(): string {
        return new URL(this.page.url()).pathname;
    }

    /**
     * Navigate back with smart waiting
     */
    async goBack(options = { waitForLoad: true }) {
        await this.page.goBack();
        if (options.waitForLoad) {
            await this.waitForPageLoad();
        }
    }

    /**
     * Navigate forward with smart waiting
     */
    async goForward(options = { waitForLoad: true }) {
        await this.page.goForward();
        if (options.waitForLoad) {
            await this.waitForPageLoad();
        }
    }

    /**
     * Refresh page with smart waiting
     */
    async refresh(options = { waitForLoad: true }) {
        await this.page.reload();
        if (options.waitForLoad) {
            await this.waitForPageLoad();
        }
    }

    /**
     * Wait for URL to include specific path
     */
    async waitForUrl(urlPattern: string | RegExp, options = { timeout: config.timeouts.navigation }) {
        await this.page.waitForURL(urlPattern, { timeout: options.timeout });
    }
} 