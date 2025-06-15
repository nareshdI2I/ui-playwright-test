import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import testData from '../test-data/login-credentials.json';
import * as fs from 'fs';
import * as path from 'path';

interface LoginTestData {
    testId: string;
    testCategory: string;
    testScenario: string;
    username: string;
    password: string;
    expectedResult: string;
    preconditions: string;
    testSteps: string;
    severity: string;
    remarks: string;
}

// Store performance results for all tests
const performanceResults: {
    testId: string;
    testScenario: string;
    duration: number;
    expected: string;
    actual: string;
    result: string;
    severity: string;
    errorMessage: string;
    remarks: string;
}[] = [];

test.describe('DemoQA Login Tests', () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.goto();
    });

    // Run all test cases
    for (const data of testData.testCases) {
        test(`[${data.testId}] ${data.testScenario}`, async () => {
            console.log(`\nExecuting test: ${data.testId} - ${data.testScenario}`);
            console.log(`Preconditions: ${data.preconditions}`);
            console.log(`Test Steps: ${data.testSteps}`);

            // Measure performance
            const startTime = Date.now();
            const result = await loginPage.validateLogin(data);
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Determine pass/fail
            let testResult = 'pass';
            let errorMsg = result.errorMessage || '';
            try {
                expect(result.actualResult, 
                    `Login result mismatch for ${data.testScenario}\nError: ${result.errorMessage || 'No error message'}`
                ).toBe(data.expectedResult);

                if (data.expectedResult === 'success') {
                    // Verify redirect to profile page
                    const currentUrl = await loginPage.getCurrentUrl();
                    expect(currentUrl, 'Should redirect to profile page').toContain('/profile');

                    // Verify username is displayed on profile page
                    const header = await loginPage.getProviderDashboardElement();
                    await expect(header).toBeVisible();
                    const usernameText = await header.textContent();
                    expect(usernameText, 'Username should be displayed on profile page').toBe(data.username);
                } else {
                    // Verify user remains on login page
                    const currentUrl = await loginPage.getCurrentUrl();
                    expect(currentUrl, 'Should remain on login page').toContain('/login');

                    // Verify appropriate error message
                    expect(result.errorMessage, 
                        `Expected error message for ${data.testScenario}`
                    ).toBeTruthy();
                }
            } catch (e: any) {
                testResult = 'fail';
                errorMsg = e?.message || errorMsg;
                throw e; // rethrow to let Playwright report the failure
            } finally {
                // Store result for summary
                performanceResults.push({
                    testId: data.testId,
                    testScenario: data.testScenario,
                    duration,
                    expected: data.expectedResult,
                    actual: result.actualResult,
                    result: testResult,
                    severity: data.severity,
                    errorMessage: errorMsg,
                    remarks: data.remarks
                });
            }
        });
    }

    test.afterAll(async () => {
        // Print performance summary table
        console.log("\nAggregated Performance Results:");
        console.log("| Test ID     | Scenario                | Duration (ms) | Expected | Actual   | Result | Severity | Error Message                | Remarks                 |");
        console.log("|-------------|-------------------------|---------------|----------|----------|--------|----------|-----------------------------|-------------------------|");
        for (const r of performanceResults) {
            console.log(`| ${r.testId.padEnd(11)}| ${r.testScenario.padEnd(24)}| ${r.duration.toString().padEnd(13)}| ${r.expected.padEnd(8)}| ${r.actual.padEnd(8)}| ${r.result.padEnd(6)}| ${r.severity.padEnd(8)}| ${r.errorMessage.substring(0,27).padEnd(29)}| ${r.remarks.substring(0,23).padEnd(25)}|`);
        }
        console.log("\n");

        // Generate HTML report
        const htmlReport = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Performance Report</title>
            <style>
                body { font-family: Arial, sans-serif; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                tr.pass { background-color: #d4edda; }
                tr.fail { background-color: #f8d7da; }
            </style>
        </head>
        <body>
            <h1>Aggregated Performance Results</h1>
            <table>
                <thead>
                    <tr>
                        <th>Test ID</th>
                        <th>Scenario</th>
                        <th>Duration (ms)</th>
                        <th>Expected</th>
                        <th>Actual</th>
                        <th>Result</th>
                        <th>Severity</th>
                        <th>Error Message</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    ${performanceResults.map(r => `
                        <tr class="${r.actual === r.expected ? 'pass' : 'fail'}">
                            <td>${r.testId}</td>
                            <td>${r.testScenario}</td>
                            <td>${r.duration}</td>
                            <td>${r.expected}</td>
                            <td>${r.actual}</td>
                            <td>${r.result}</td>
                            <td>${r.severity}</td>
                            <td>${r.errorMessage}</td>
                            <td>${r.remarks}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
        `;

        // Write HTML report to file
        const reportPath = path.join(__dirname, 'performance-report.html');
        fs.writeFileSync(reportPath, htmlReport);
        console.log(`HTML report generated at: ${reportPath}`);
    });
}); 