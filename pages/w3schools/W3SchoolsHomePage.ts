import { Page, Locator } from '@playwright/test';

export class W3SchoolsHomePage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchResultLink: (text: string) => Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByRole('textbox', { name: 'Search our tutorials' });
    this.searchResultLink = (text: string) => page.getByRole('link', { name: text });
  }

  async navigate() {
    await this.page.goto('/');
  }

  async searchFor(term: string) {
    await this.searchInput.click();
    await this.searchInput.fill(term);
  }

  async clickSearchResult(resultText: string) {
    await this.searchResultLink(resultText).click();
  }
} 