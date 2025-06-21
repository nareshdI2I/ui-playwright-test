import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

export class DashboardPage extends BasePage {
    private readonly welcomeMessage = '.welcome-message';
    private readonly userProfileButton = '#user-profile';
    private readonly logoutButton = '#logout-button';
    private readonly dashboardTitle = '.dashboard-title';
    readonly elementsCard: Locator;
    readonly alertsFramesWindowsCard: Locator;

    constructor(page: Page) {
        super(page);
        this.elementsCard = page.locator('.card-body:has-text("Elements")');
        this.alertsFramesWindowsCard = page.locator('.card-body:has-text("Alerts, Frame & Windows")');
    }

    async getWelcomeMessage() {
        return await this.page.textContent(this.welcomeMessage);
    }

    async isDashboardDisplayed() {
        return await this.page.isVisible(this.dashboardTitle);
    }

    async clickUserProfile() {
        await this.page.click(this.userProfileButton);
    }

    async logout() {
        await this.page.click(this.logoutButton);
    }

    async getDashboardTitle() {
        return await this.page.textContent(this.dashboardTitle);
    }

    async navigate() {
        await this.page.goto('/');
        await this.elementsCard.waitFor();
    }

    async clickAlertsFramesWindowsCard() {
        const navigationPromise = this.page.waitForURL('**/alerts');
        await this.alertsFramesWindowsCard.click();
        await navigationPromise;
    }

    getPagePath(): string {
        return '';
    }
    
    selectors = {};
} 