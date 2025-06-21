/// <reference lib="dom" />
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class InventoryPage extends BasePage {
    // Locators
    private readonly inventoryList = '.inventory_list';
    private readonly sortDropdown = '[data-test="product_sort_container"]';
    private readonly cartButton = '.shopping_cart_link';
    private readonly addToCartButtons = '[data-test^="add-to-cart"]';
    private readonly inventoryItems = '.inventory_item';

    constructor(page: Page) {
        super(page);
    }

    protected getPagePath(): string {
        return '/inventory.html';
    }

    protected get selectors(): Record<string, string> {
        return {
            inventoryList: this.inventoryList,
            sortDropdown: this.sortDropdown,
            cartButton: this.cartButton,
            addToCartButtons: this.addToCartButtons,
            inventoryItems: this.inventoryItems
        };
    }

    async isLoaded() {
        try {
            await this.page.waitForURL('**/inventory.html');
            // eslint-disable-next-line playwright/no-wait-for-selector
            await this.page.waitForSelector(this.inventoryList, { state: 'visible' });
            // eslint-disable-next-line playwright/no-wait-for-selector
            await this.page.waitForSelector(this.sortDropdown, { state: 'visible' });
            return true;
        } catch {
            return false;
        }
    }

    async sortProducts(sortOption: string) {
        try {
            // eslint-disable-next-line playwright/no-wait-for-selector
            await this.page.waitForSelector(this.sortDropdown, { state: 'visible' });
            // Get the first product name before sorting
            const firstProductSelector = '.inventory_item_name';
            const beforeSort = await this.page.textContent(firstProductSelector);
            await this.page.selectOption(this.sortDropdown, sortOption);
            // Wait for the first product name to change
            await this.page.waitForFunction(
                ({ selector, before }: { selector: string; before: string | null }) =>
                    // eslint-disable-next-line no-undef
                    document.querySelector(selector)?.textContent !== before,
                { selector: firstProductSelector, before: beforeSort }
            );
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to sort products: ${errorMessage}`);
        }
    }

    async addItemToCart(itemIndex: number) {
        // eslint-disable-next-line playwright/no-wait-for-selector
        await this.page.waitForSelector(this.addToCartButtons);
        // eslint-disable-next-line playwright/no-element-handle
        const buttons = await this.page.$$(this.addToCartButtons);
        if (buttons[itemIndex]) {
            await buttons[itemIndex].click();
        }
    }

    async getCartItemCount() {
        try {
            // eslint-disable-next-line playwright/no-wait-for-selector
            await this.page.waitForSelector('.shopping_cart_badge', { timeout: 2000 });
            return await this.page.textContent('.shopping_cart_badge');
        } catch {
            return '0';
        }
    }

    async getAllProductNames() {
        // eslint-disable-next-line playwright/no-wait-for-selector
        await this.page.waitForSelector('.inventory_item_name');
        // eslint-disable-next-line playwright/no-eval
        return this.page.$$eval(
            '.inventory_item_name',
            elements => elements.map(el => el.textContent)
        );
    }
} 