// @ts-check

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
    testDir: '../',
    testMatch: '**/login.spec.ts',
    use: {
        baseURL: 'https://demoqa.com',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure'
    },
    projects: [
        {
            name: 'loginregression',
            testMatch: '**/login.spec.ts',
            retries: 1,
            use: {
                browserName: 'chromium',
                viewport: { width: 1280, height: 720 },
                actionTimeout: 10000,
                navigationTimeout: 15000
            },
        }
    ],
    reporter: [
        ['html'],
        ['junit', { outputFile: 'test-results/login-junit-results.xml' }],
        ['json', { outputFile: 'test-results/login-json-results.json' }]
    ],
    timeout: 60000,
    workers: 1
};

module.exports = config; 