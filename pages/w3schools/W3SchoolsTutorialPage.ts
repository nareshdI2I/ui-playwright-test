import { Page, Locator } from '@playwright/test';

export class W3SchoolsTutorialPage {
  readonly page: Page;
  readonly nextButton: Locator;
  readonly exerciseInput: Locator;
  readonly submitAnswerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nextButton = page.getByRole('link', { name: 'Next ❯' }).first();
    this.exerciseInput = page.locator('input[name="ex1"]');
    this.submitAnswerButton = page.getByRole('button', { name: 'Submit Answer »' });
  }

  async clickNext() {
    await this.nextButton.click();
  }

  async fillExercise(answer: string) {
    await this.exerciseInput.click();
    await this.exerciseInput.fill(answer);
  }

  async submitAnswer(): Promise<Page> {
    const popupPromise = this.page.waitForEvent('popup');
    await this.submitAnswerButton.click();
    return await popupPromise;
  }
} 