import { Page } from '@playwright/test';

export class DashboardPage {
    private page: Page;

    // Locators
    private readonly welcomeMessage = '.welcome-message';
    private readonly userProfileButton = '#user-profile';
    private readonly logoutButton = '#logout-button';
    private readonly dashboardTitle = '.dashboard-title';

    constructor(page: Page) {
        this.page = page;
    }

    // Actions
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
} 