import { Page, expect } from '@playwright/test';

export class TestUtils {
    constructor(private page: Page) {}

    /**
     * Smart wait function that polls for an element with dynamic content
     */
    async waitForDynamicContent(selector: string, expectedText: string | RegExp, options = { timeout: 30000, interval: 1000 }) {
        await expect(async () => {
            // eslint-disable-next-line playwright/no-element-handle
            const element = await this.page.$(selector);
            if (element) {
                const text = await element.textContent();
                expect(text).toMatch(expectedText);
            }
        }).toPass({
            timeout: options.timeout,
            intervals: [options.interval]
        });
    }

    /**
     * Wait for loading indicator to disappear
     */
    async waitForLoadingToDisappear(loadingSelector = '[data-testid="loading"]', timeout = 30000) {
        try {
            // eslint-disable-next-line playwright/no-wait-for-selector
            await this.page.waitForSelector(loadingSelector, { state: 'visible', timeout: 1000 });
            // eslint-disable-next-line playwright/no-wait-for-selector
            await this.page.waitForSelector(loadingSelector, { state: 'hidden', timeout });
        } catch {
            // If loading indicator is not found initially, it might have disappeared already
            return;
        }
    }

    /**
     * Wait for network requests to complete
     */
    async waitForNetworkIdle(timeout = 30000) {
        await this.page.waitForLoadState('load', { timeout });
    }

    /**
     * Smart retry function for actions that might fail
     */
    async retryAction<T>(
        action: () => Promise<T>,
        options = { 
            retries: 3, 
            delay: 1000,
            shouldRetry: (_error: Error) => true // Custom retry condition
        }
    ): Promise<T> {
        let lastError: Error;

        for (let attempt = 0; attempt <= options.retries; attempt++) {
            try {
                return await action();
            } catch (error) {
                lastError = error as Error;
                if (attempt === options.retries || !options.shouldRetry(error as Error)) {
                    throw error;
                }
                await new Promise(res => setTimeout(res, options.delay));
            }
        }

        throw lastError!;
    }

    /**
     * Wait for element to be stable (no position changes)
     */
    async waitForElementStable(selector: string, options = { timeout: 10000, stabilityDuration: 1000 }) {
        const startTime = Date.now();
        let lastRect: { x: number; y: number } | null = null;

        while (Date.now() - startTime < options.timeout) {
            // eslint-disable-next-line playwright/no-element-handle
            const element = await this.page.$(selector);
            if (!element) continue;

            const box = await element.boundingBox();
            if (!box) continue;

            const currentRect = { x: box.x, y: box.y };

            if (lastRect && 
                lastRect.x === currentRect.x && 
                lastRect.y === currentRect.y) {
                await new Promise(res => setTimeout(res, options.stabilityDuration));
                // Check one more time after stability duration
                // eslint-disable-next-line playwright/no-element-handle
                const finalBox = await (await this.page.$(selector))?.boundingBox();
                if (finalBox && finalBox.x === currentRect.x && finalBox.y === currentRect.y) {
                    return;
                }
            }

            lastRect = currentRect;
            await new Promise(res => setTimeout(res, 100));
        }

        throw new Error(`Element ${selector} did not stabilize within ${options.timeout}ms`);
    }
} 