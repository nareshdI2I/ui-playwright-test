import { Page, Locator } from '@playwright/test';
import { TestUtils } from '../utils/test-utils';
import { FormHandler } from './components/FormHandler';
import { NavigationHandler } from './components/NavigationHandler';
import { config } from '../config/env.config';
import { SmartLocatorService } from '../services/SmartLocatorService';

/**
 * Base page class with smart element location and common page interactions
 */
export abstract class BasePage {
    protected page: Page;
    protected utils: TestUtils;
    protected form: FormHandler;
    protected navigation: NavigationHandler;
    protected smartLocator: SmartLocatorService;

    constructor(page: Page) {
        this.page = page;
        this.utils = new TestUtils(page);
        this.form = new FormHandler(page);
        this.navigation = new NavigationHandler(page);
        this.smartLocator = new SmartLocatorService(page, 'test-results/locator-history.json');
    }

    // Abstract methods that must be implemented by child classes
    protected abstract getPagePath(): string;
    protected abstract get selectors(): Record<string, string>;

    // Navigation methods
    async goto(): Promise<void> {
        await this.page.goto(this.getPagePath());
    }

    async isCurrentPage(): Promise<boolean> {
        return this.page.url().includes(this.getPagePath());
    }

    async waitForPageLoad(): Promise<void> {
        await this.page.waitForLoadState('networkidle', {
            timeout: config.timeouts.navigation
        });
    }

    // Smart element interaction methods
    protected async getElement(key: string, selector: string): Promise<Locator> {
        return this.smartLocator.findElement(key, selector);
    }

    protected async clickElement(key: string, selector: string): Promise<void> {
        const element = await this.getElement(key, selector);
        await element.click();
    }

    protected async fillElement(key: string, selector: string, value: string): Promise<void> {
        const element = await this.getElement(key, selector);
        await element.fill(value);
    }

    protected async getText(key: string, selector: string): Promise<string> {
        const element = await this.getElement(key, selector);
        const text = await element.textContent();
        return text?.trim() ?? '';
    }

    protected async isVisible(key: string, selector: string): Promise<boolean> {
        try {
            const element = await this.getElement(key, selector);
            return await element.isVisible();
        } catch {
            return false;
        }
    }

    protected async waitForElement(key: string, selector: string, options?: { timeout?: number }): Promise<Locator> {
        const element = await this.getElement(key, selector);
        await element.waitFor({ 
            state: 'visible', 
            timeout: options?.timeout ?? config.timeouts.element 
        });
        return element;
    }

    protected async selectOption(key: string, selector: string, value: string): Promise<void> {
        const element = await this.getElement(key, selector);
        await element.selectOption(value);
    }

    protected async hover(key: string, selector: string): Promise<void> {
        const element = await this.getElement(key, selector);
        await element.hover();
    }

    protected async dragAndDrop(
        sourceKey: string, 
        sourceSelector: string, 
        targetKey: string, 
        targetSelector: string
    ): Promise<void> {
        const sourceElement = await this.getElement(sourceKey, sourceSelector);
        const targetElement = await this.getElement(targetKey, targetSelector);
        await sourceElement.dragTo(targetElement);
    }

    protected async getAttribute(key: string, selector: string, attributeName: string): Promise<string> {
        const element = await this.getElement(key, selector);
        const value = await element.getAttribute(attributeName);
        return value ?? '';
    }

    // Utility methods
    protected async screenshot(name: string): Promise<void> {
        await this.page.screenshot({
            path: `./screenshots/${name}.png`,
            fullPage: true
        });
    }

    /**
     * Wait for the page to be loaded and ready
     */
    async waitForReady() {
        await this.navigation.waitForPageLoad();
        await this.waitForPageSpecificElements();
    }

    /**
     * Wait for page-specific elements
     * Can be overridden by child classes
     */
    protected async waitForPageSpecificElements() {
        // Default implementation - override in child classes if needed
        return Promise.resolve();
    }

    /**
     * Get page title
     */
    async getTitle(): Promise<string> {
        return this.page.title();
    }

    /**
     * Check if element exists
     */
    async hasElement(selector: string): Promise<boolean> {
        try {
            await this.page.waitForSelector(selector, {
                state: 'attached',
                timeout: config.timeouts.element
            });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get text content of an element
     */
    async getTextContent(selector: string): Promise<string | null> {
        const element = await this.page.waitForSelector(selector, {
            state: 'attached',
            timeout: config.timeouts.element
        });
        return element.textContent();
    }

    /**
     * Click element with retry logic
     */
    async click(selector: string) {
        await this.utils.retryAction(async () => {
            await this.utils.waitForElementStable(selector);
            await this.page.click(selector);
        });
    }

    /**
     * Wait for element to be visible
     */
    async waitForVisible(selector: string, timeout = config.timeouts.element) {
        await this.page.waitForSelector(selector, {
            state: 'visible',
            timeout
        });
    }

    /**
     * Wait for element to be hidden
     */
    async waitForHidden(selector: string, timeout = config.timeouts.element) {
        await this.page.waitForSelector(selector, {
            state: 'hidden',
            timeout
        });
    }

    async waitForDynamicContent(selector: string, expectedText: string | RegExp) {
        await this.utils.waitForDynamicContent(selector, expectedText, {
            timeout: config.timeouts.element,
            interval: 1000
        });
    }

    /**
     * Highlights an element on the page
     */
    private async highlightElement(element: Locator): Promise<void> {
        try {
            await element.evaluate((el) => {
                const originalTransition = el.style.transition;
                const originalOutline = el.style.outline;

                // Add yellow highlight with transition
                el.style.transition = 'all 0.2s ease-in-out';
                el.style.outline = '2px solid red';

                // Reset after animation
                setTimeout(() => {
                    el.style.outline = originalOutline;
                    el.style.transition = originalTransition;
                }, 1000);
            });
        } catch (error) {
            console.warn('Failed to highlight element:', error);
        }
    }

    /**
     * Waits for an element to be ready for interaction
     */
    private async waitForInteractive(element: Locator, timeout = 10000): Promise<void> {
        await element.waitFor({ state: 'visible', timeout });
        
        // Wait for element to be stable (no movement)
        const elementHandle = await element.elementHandle();
        if (!elementHandle) return;

        await this.page.waitForFunction(
            (el) => {
                const rect = el.getBoundingClientRect();
                return rect.top !== 0 || rect.left !== 0;
            },
            elementHandle,
            { timeout }
        );
    }

    /**
     * Enhanced click with retries and multiple strategies
     * @param target - Either a selector string or Locator object
     * @param options - Click options including timeout and retry count
     */
    protected async clickWithRetry(
        target: string | Locator,
        options = { 
            timeout: config.timeouts.element, 
            retries: 3,
            delay: 1000
        }
    ): Promise<boolean> {
        let lastError: Error | undefined;
        let element: Locator;

        // Convert string selector to Locator if needed
        if (typeof target === 'string') {
            element = this.page.locator(target);
        } else {
            element = target;
        }

        for (let attempt = 0; attempt < options.retries; attempt++) {
            try {
                // Highlight the element before clicking
                await this.highlightElement(element);

                // Wait for element to be interactive
                await this.waitForInteractive(element, options.timeout);

                // Try regular click first
                await element.click({ timeout: options.timeout / options.retries });
                return true;
            } catch (error) {
                lastError = error as Error;
                console.log(`Click attempt ${attempt + 1} failed, trying alternative methods...`);

                try {
                    // Try force click
                    await element.click({ force: true });
                    return true;
                } catch {
                    try {
                        // Try JavaScript click
                        await element.evaluate((el: HTMLElement) => el.click());
                        return true;
                    } catch {
                        // If we're on the last attempt, wait a bit before retrying
                        if (attempt < options.retries - 1) {
                            await this.page.waitForTimeout(options.delay);
                        }
                    }
                }
            }
        }

        throw new Error(`Failed to click element after ${options.retries} attempts. Last error: ${lastError?.message}`);
    }

    /**
     * Smart interaction methods with automatic waiting and highlighting
     */
    protected async smartClick(key: string, selector: string): Promise<void> {
        const element = await this.smartLocator.findElement(key, selector);
        await this.clickWithRetry(element);
    }

    protected async smartFill(key: string, selector: string, value: string): Promise<void> {
        const element = await this.smartLocator.findElement(key, selector);
        await this.highlightElement(element);
        await this.waitForInteractive(element);
        await element.fill(value);
    }

    protected async smartGetText(key: string, selector: string): Promise<string> {
        const element = await this.smartLocator.findElement(key, selector);
        await this.highlightElement(element);
        const text = await element.textContent();
        return text?.trim() ?? '';
    }

    protected async smartSelect(key: string, selector: string, value: string): Promise<void> {
        const element = await this.smartLocator.findElement(key, selector);
        await this.highlightElement(element);
        await this.waitForInteractive(element);
        await element.selectOption(value);
    }

    protected async smartHover(key: string, selector: string): Promise<void> {
        const element = await this.smartLocator.findElement(key, selector);
        await this.highlightElement(element);
        await this.waitForInteractive(element);
        await element.hover();
    }

    protected async smartGetAttribute(key: string, selector: string, attributeName: string): Promise<string> {
        const element = await this.smartLocator.findElement(key, selector);
        await this.highlightElement(element);
        const value = await element.getAttribute(attributeName);
        return value ?? '';
    }

    protected async isElementVisible(key: string, selector: string): Promise<boolean> {
        try {
            const element = await this.smartLocator.findElement(key, selector);
            await this.highlightElement(element);
            return await element.isVisible();
        } catch {
            return false;
        }
    }
} 