import { test, expect } from '@playwright/test';
import { W3SchoolsHomePage } from '../../pages/w3schools/W3SchoolsHomePage';
import { W3SchoolsTutorialPage } from '../../pages/w3schools/W3SchoolsTutorialPage';
import { W3SchoolsResultPage } from '../../pages/w3schools/W3SchoolsResultPage';

test('W3Schools TypeScript Tutorial Interaction', async ({ page }) => {
  // 1. Navigate and search
  const homePage = new W3SchoolsHomePage(page);
  await homePage.navigate();
  await homePage.searchFor('typescript');
  await homePage.clickSearchResult('TypeScript Tutorial');

  // 2. Interact with the tutorial page
  const tutorialPage = new W3SchoolsTutorialPage(page);
  await tutorialPage.clickNext();
  await tutorialPage.fillExercise('code');
  const resultPagePopup = await tutorialPage.submitAnswer();

  // 3. Interact with the result popup
  const resultPage = new W3SchoolsResultPage(resultPagePopup);
  await resultPage.showAnswer();
  await resultPage.clickCorrectAnswerContainer();

  // We can add an assertion here to make the test more robust
  await expect(resultPage.correctAnswerContainer).toBeVisible();
}); 