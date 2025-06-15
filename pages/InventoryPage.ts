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
            await this.page.waitForSelector(this.inventoryList, { state: 'visible' });
            await this.page.waitForSelector(this.sortDropdown, { state: 'visible' });
            return true;
        } catch (error) {
            return false;
        }
    }

    async sortProducts(sortOption: string) {
        try {
            await this.page.waitForSelector(this.sortDropdown, { state: 'visible' });
            await this.page.selectOption(this.sortDropdown, sortOption);
            // Wait for the sorting to take effect
            await this.page.waitForTimeout(1000);
        } catch (error: any) {
            throw new Error(`Failed to sort products: ${error.message}`);
        }
    }

    async addItemToCart(itemIndex: number) {
        await this.page.waitForSelector(this.addToCartButtons);
        const buttons = await this.page.$$(this.addToCartButtons);
        if (buttons[itemIndex]) {
            await buttons[itemIndex].click();
        }
    }

    async getCartItemCount() {
        try {
            await this.page.waitForSelector('.shopping_cart_badge', { timeout: 2000 });
            return await this.page.textContent('.shopping_cart_badge');
        } catch {
            return '0';
        }
    }

    async getAllProductNames() {
        await this.page.waitForSelector('.inventory_item_name');
        return this.page.$$eval(
            '.inventory_item_name',
            elements => elements.map(el => el.textContent)
        );
    }
} 