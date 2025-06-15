import { PlaywrightTestConfig } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
    testDir: './tests',
    timeout: 60000,
    expect: {
        timeout: 10000
    },
    // Run tests in files in parallel
    fullyParallel: true,
    // Fail the build on CI if you accidentally left test.only in the source code
    forbidOnly: !!process.env.CI,
    // Retry on CI only
    retries: process.env.CI ? 2 : 1,
    // Opt out of parallel tests on CI
    workers: process.env.CI ? 3 : 1,
    reporter: 'html',
    use: {
        baseURL: 'https://demoqa.com',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        browserName: 'chromium'
    },
    outputDir: 'test-results',
    
    /* Configure project for Chrome browser */
    projects: [
        {
            name: 'chromium',
            use: {
                browserName: 'chromium',
            },
        }
    ],
};

export default config;
