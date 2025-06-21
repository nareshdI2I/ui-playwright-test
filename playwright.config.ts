import { PlaywrightTestConfig } from '@playwright/test';
import { config as envConfig, currentEnv } from './config/env.config';
import dotenv from 'dotenv';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config();

// eslint-disable-next-line no-console
console.log(`Running tests in environment: ${currentEnv}`);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
    testDir: './tests',
    timeout: envConfig.timeouts.default,
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
    reporter: [
        ['html'],
        ['junit', { outputFile: 'test-results/login-junit-results.xml' }],
        ['json', { outputFile: 'test-results/test-results.json' }]
    ],
    use: {
        baseURL: envConfig.baseUrl,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        browserName: 'chromium'
    },
    outputDir: 'test-results',
    
    /* Configure projects for different browsers and test sets */
    projects: [
        {
            name: 'chromium-demoqa',
            // testMatch is removed, files will be passed via CLI by the suite runner
            use: {
                browserName: 'chromium',
            },
        },
        {
            name: 'w3schools',
            // testMatch is removed, files will be passed via CLI by the suite runner
            use: {
                browserName: 'chromium',
                baseURL: 'https://www.w3schools.com',
            }
        }
    ],
};

export default config;
