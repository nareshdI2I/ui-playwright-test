import { Page, Locator } from '@playwright/test';

export class W3SchoolsResultPage {
  readonly page: Page;
  readonly showAnswerButton: Locator;
  readonly correctAnswerContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.showAnswerButton = page.getByRole('button', { name: 'Show Answer' });
    this.correctAnswerContainer = page.locator('#showcorrectanswercontainer');
  }

  async showAnswer() {
    await this.showAnswerButton.click();
  }

  async clickCorrectAnswerContainer() {
    await this.correctAnswerContainer.click();
  }
} 