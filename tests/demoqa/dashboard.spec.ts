import { test, expect } from '@playwright/test';
import { ElementsPage } from '../../pages/demoqa/ElementsPage';
import * as dashboardData from '../../test-data/dashboard-data.json' assert { type: 'json' };

test.describe('Dashboard and Elements Interaction', () => {

  test('Scenario 1: Navigate to Elements page successfully', async ({ page }) => {
    // Navigate directly to the Elements page. This is more robust.
    await page.goto('/elements');
    
    // Wait for page to load and check for any header element
    await page.waitForLoadState('networkidle');
    
    // Try different selectors for the header
    const headerSelectors = [
      '.main-header',
      'h1',
      '.header',
      '[class*="header"]',
      'div[class*="main"]'
    ];
    
    let headerFound = false;
    for (const selector of headerSelectors) {
      try {
        const element = page.locator(selector);
        if (await element.isVisible({ timeout: 2000 })) {
          const text = await element.textContent();
          console.log(`Found header with selector "${selector}": ${text}`);
          headerFound = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!headerFound) {
      // Take a screenshot for debugging
      await page.screenshot({ path: 'elements-page-debug.png' });
      throw new Error('No header element found on Elements page');
    }
    
    // Verify the page loaded correctly - be more flexible with the text
    await expect(page.locator('body')).toContainText('Elements');
  });

  test('Scenario 2: Fill and submit the Text Box form', async ({ page }) => {
    // Check if data is available
    if (!dashboardData || !dashboardData.textBox) {
      throw new Error('Dashboard data not loaded correctly');
    }
    
    console.log('Dashboard data:', JSON.stringify(dashboardData, null, 2));
    
    // Navigate directly to the Elements page.
    await page.goto('/elements');
    await page.waitForLoadState('networkidle');
    
    const elementsPage = new ElementsPage(page);
    
    // Wait for the text box button to be available
    await elementsPage.textBoxButton.waitFor({ state: 'visible', timeout: 10000 });
    await elementsPage.textBoxButton.click();

    // Wait for the form to be visible
    await elementsPage.fullNameInput.waitFor({ state: 'visible', timeout: 10000 });
    
    await elementsPage.fillAndSubmitTextBox(dashboardData.textBox);

    const { fullName, email, currentAddress, permanentAddress } = dashboardData.textBox;
    await expect(elementsPage.outputName).toHaveText(`Name:${fullName}`);
    await expect(elementsPage.outputEmail).toHaveText(`Email:${email}`);
    await expect(elementsPage.outputCurrentAddress).toHaveText(`Current Address :${currentAddress}`);
    await expect(elementsPage.outputPermanentAddress).toHaveText(`Permananet Address :${permanentAddress}`);
  });

  test('Scenario 3: Interact with a simple frame', async ({ page }) => {
    await page.goto('/frames');
    await page.waitForLoadState('networkidle');
    
    const frame1 = page.frameLocator('#frame1');
    await expect(frame1.locator('#sampleHeading')).toHaveText('This is a sample page');
  });

  test('Scenario 4: Interact with nested frames', async ({ page }) => {
    await page.goto('/nestedframes');
    await page.waitForLoadState('networkidle');
    
    const parentFrame = page.frameLocator('#frame1');
    const childFrame = parentFrame.frameLocator('iframe');
    await expect(childFrame.locator('body')).toHaveText('Child Iframe');
  });

}); 