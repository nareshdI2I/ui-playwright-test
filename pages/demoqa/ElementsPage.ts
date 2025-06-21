import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

export class ElementsPage extends BasePage {
  readonly header: Locator;
  readonly textBoxButton: Locator;

  // Text Box form locators
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly currentAddressInput: Locator;
  readonly permanentAddressInput: Locator;
  readonly submitButton: Locator;

  // Text Box output locators
  readonly outputName: Locator;
  readonly outputEmail: Locator;
  readonly outputCurrentAddress: Locator;
  readonly outputPermanentAddress: Locator;

  constructor(page: Page) {
    super(page);
    this.header = page.locator('//div[text()="Elements"]');
    this.textBoxButton = page.locator('.element-list.show .menu-list #item-0');
    
    // Form Inputs
    this.fullNameInput = page.locator('#userName');
    this.emailInput = page.locator('#userEmail');
    this.currentAddressInput = page.locator('#currentAddress');
    this.permanentAddressInput = page.locator('#permanentAddress');
    this.submitButton = page.locator('#submit');

    // Form Output
    this.outputName = page.locator('#output #name');
    this.outputEmail = page.locator('#output #email');
    this.outputCurrentAddress = page.locator('#output #currentAddress');
    this.outputPermanentAddress = page.locator('#output #permanentAddress');
  }

  getPagePath(): string {
    return '/elements';
  }

  selectors = {};

  async fillAndSubmitTextBox(data: { fullName: string; email: string; currentAddress: string; permanentAddress: string; }) {
    await this.fullNameInput.fill(data.fullName);
    await this.emailInput.fill(data.email);
    await this.currentAddressInput.fill(data.currentAddress);
    await this.permanentAddressInput.fill(data.permanentAddress);
    await this.submitButton.click();
  }
} 