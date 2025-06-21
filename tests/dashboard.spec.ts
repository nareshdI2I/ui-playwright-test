import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Dashboard and Elements Interaction', () => {

  test('Scenario 1: Navigate to Elements page and verify header', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.clickElementsCard();
    await expect(page.locator('.main-header')).toHaveText('Elements');
  });

  test('Scenario 2: Fill and submit the Text Box form', async ({ page }) => {
    await page.goto('/elements');
    await page.locator('li:has-text("Text Box")').click();

    const fullName = 'John Doe';
    const email = 'john.doe@example.com';
    const currentAddress = '123 Main St, Anytown, USA';
    const permanentAddress = '456 Oak Ave, Othertown, USA';

    await page.locator('#userName').fill(fullName);
    await page.locator('#userEmail').fill(email);
    await page.locator('#currentAddress').fill(currentAddress);
    await page.locator('#permanentAddress').fill(permanentAddress);
    await page.locator('#submit').click();

    await expect(page.locator('#output #name')).toHaveText(`Name:${fullName}`);
    await expect(page.locator('#output #email')).toHaveText(`Email:${email}`);
    await expect(page.locator('#output #currentAddress')).toHaveText(`Current Address :${currentAddress}`);
    await expect(page.locator('#output #permanentAddress')).toHaveText(`Permananet Address :${permanentAddress}`);
  });

  test('Scenario 3: Interact with a simple frame', async ({ page }) => {
    await page.goto('/frames');
    const frame1 = page.frameLocator('#frame1');
    await expect(frame1.locator('#sampleHeading')).toHaveText('This is a sample page');
  });

  test('Scenario 4: Interact with nested frames', async ({ page }) => {
    await page.goto('/nestedframes');
    const parentFrame = page.frameLocator('#frame1');
    const childFrame = parentFrame.frameLocator('iframe');
    await expect(childFrame.locator('body')).toHaveText('Child Iframe');
  });

}); 