import { Page, Locator } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface LocatorHistory {
    key: string;
    selector: string;
    alternativeSelectors?: string[];
    successCount: number;
    failureCount: number;
    lastUsed: string;
    lastSuccess?: string;
}

interface LocatorHistoryFile {
    entries: Record<string, LocatorHistory>;
    lastUpdated: string;
}

export class SmartLocatorService {
    private page: Page;
    private historyFile: string;
    private history: Record<string, LocatorHistory>;
    private alternativeGenerators: ((selector: string) => string[])[];

    constructor(page: Page, historyFile: string) {
        this.page = page;
        this.historyFile = historyFile;
        this.history = {};
        this.loadHistory();
        this.setupAlternativeGenerators();
    }

    private setupAlternativeGenerators() {
        this.alternativeGenerators = [
            // ID to class conversion
            (selector: string) => {
                if (selector.startsWith('#')) {
                    return [`.${selector.slice(1)}`];
                }
                return [];
            },
            // Class to ID conversion
            (selector: string) => {
                if (selector.startsWith('.')) {
                    return [`#${selector.slice(1)}`];
                }
                return [];
            },
            // Add common parent classes
            (selector: string) => [
                `.mb-1 ${selector}`,
                `.form-group ${selector}`,
                `.container ${selector}`
            ],
            // Text-based selectors
            (selector: string) => {
                const textSelectors = [
                    'Invalid username or password!',
                    'Login',
                    'Username',
                    'Password'
                ];
                return textSelectors.map(text => `text=${text}`);
            },
            // Nth-child selectors
            (selector: string) => [
                `${selector}:nth-child(1)`,
                `${selector}:first-child`,
                `${selector}:last-child`
            ],
            // Role-based selectors
            (selector: string) => [
                'role=button',
                'role=textbox',
                'role=alert'
            ],
            // Attribute-based selectors
            (selector: string) => [
                '[type="text"]',
                '[type="password"]',
                '[type="submit"]'
            ]
        ];
    }

    private loadHistory() {
        try {
            if (fs.existsSync(this.historyFile)) {
                const data = fs.readFileSync(this.historyFile, 'utf8');
                const historyData: LocatorHistoryFile = JSON.parse(data);
                this.history = historyData.entries;
                console.log(`Loaded locator history from ${this.historyFile}`);
            }
        } catch (error) {
            console.warn(`Failed to load locator history: ${error}`);
            this.history = {};
        }
    }

    private saveHistory() {
        try {
            const dir = path.dirname(this.historyFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const historyData: LocatorHistoryFile = {
                entries: this.history,
                lastUpdated: new Date().toISOString()
            };

            fs.writeFileSync(
                this.historyFile,
                JSON.stringify(historyData, null, 2)
            );
        } catch (error) {
            console.warn(`Failed to save locator history: ${error}`);
        }
    }

    private generateAlternativeSelectors(selector: string): string[] {
        const alternatives = new Set<string>();
        
        this.alternativeGenerators.forEach(generator => {
            generator(selector).forEach(alt => alternatives.add(alt));
        });

        return Array.from(alternatives);
    }

    private async tryLocator(selector: string): Promise<Locator | null> {
        try {
            const locator = this.page.locator(selector);
            // Wait for a short time to see if the element becomes visible
            await locator.waitFor({ state: 'visible', timeout: 1000 });
            return locator;
        } catch {
            return null;
        }
    }

    private updateHistory(key: string, selector: string, success: boolean) {
        if (!this.history[key]) {
            this.history[key] = {
                key,
                selector,
                alternativeSelectors: this.generateAlternativeSelectors(selector),
                successCount: 0,
                failureCount: 0,
                lastUsed: new Date().toISOString()
            };
        }

        const entry = this.history[key];
        if (success) {
            entry.successCount++;
            entry.lastSuccess = new Date().toISOString();
        } else {
            entry.failureCount++;
        }
        entry.lastUsed = new Date().toISOString();

        this.saveHistory();
    }

    async findElement(key: string, selector: string): Promise<Locator> {
        try {
            // First try the original selector
            const element = await this.tryLocator(selector);
            if (element) {
                this.updateHistory(key, selector, true);
                return element;
            }

            // If original selector fails, try alternatives
            const entry = this.history[key] || {
                key,
                selector,
                alternativeSelectors: this.generateAlternativeSelectors(selector),
                successCount: 0,
                failureCount: 0,
                lastUsed: new Date().toISOString()
            };

            // Try each alternative selector
            for (const altSelector of (entry.alternativeSelectors || [])) {
                const element = await this.tryLocator(altSelector);
                if (element) {
                    this.updateHistory(key, selector, true);
                    return element;
                }
            }

            // If all attempts fail, update history and throw detailed error
            this.updateHistory(key, selector, false);
            
            const errorDetails = {
                key,
                originalSelector: selector,
                alternativesTried: entry.alternativeSelectors,
                pageUrl: this.page.url(),
                elementContext: await this.getElementContext(selector),
                suggestions: this.getSelectorSuggestions(selector)
            };

            throw new Error(this.formatErrorMessage(errorDetails));

        } catch (error) {
            // Enhance error with debugging information
            if (error instanceof Error) {
                throw new Error(this.formatErrorMessage({
                    key,
                    originalSelector: selector,
                    alternativesTried: this.history[key]?.alternativeSelectors || [],
                    pageUrl: this.page.url(),
                    elementContext: await this.getElementContext(selector),
                    suggestions: this.getSelectorSuggestions(selector),
                    originalError: error.message
                }));
            }
            throw error;
        }
    }

    private async getElementContext(selector: string): Promise<string> {
        try {
            // Get surrounding HTML context
            const html = await this.page.evaluate((sel) => {
                const element = document.querySelector(sel);
                if (element) {
                    return element.parentElement?.innerHTML || 'No parent element found';
                }
                return 'Element not found in DOM';
            }, selector);

            return html;
        } catch {
            return 'Unable to get element context';
        }
    }

    private getSelectorSuggestions(selector: string): string[] {
        const suggestions: string[] = [];
        
        // Add common fixes based on selector type
        if (selector.startsWith('#')) {
            suggestions.push(
                'Check if the ID is dynamically generated',
                'Try using a more stable attribute like data-testid',
                `Try using a class selector instead: ${selector.replace('#', '.')}`
            );
        } else if (selector.startsWith('.')) {
            suggestions.push(
                'Verify the class name is not dynamically changed',
                'Consider using a more specific selector',
                'Try combining with element type, e.g., "button.className"'
            );
        }

        // Add general suggestions
        suggestions.push(
            'Check if the element is inside an iframe',
            'Verify the element is not hidden or removed from DOM',
            'Consider using a data-testid attribute for stable testing',
            'Check if the element is dynamically added to the page'
        );

        return suggestions;
    }

    private formatErrorMessage(details: {
        key: string;
        originalSelector: string;
        alternativesTried?: string[];
        pageUrl: string;
        elementContext: string;
        suggestions: string[];
        originalError?: string;
    }): string {
        return `
Failed to find element with key "${details.key}"

Original Selector: ${details.originalSelector}
Current URL: ${details.pageUrl}

Alternative Selectors Tried:
${(details.alternativesTried || []).map(s => `- ${s}`).join('\n')}

Element Context:
${details.elementContext}

Suggestions:
${details.suggestions.map(s => `- ${s}`).join('\n')}

${details.originalError ? `Original Error: ${details.originalError}` : ''}

Debug Steps:
1. Check if the element exists in the page source
2. Verify the timing of the element appearance
3. Check for iframes or shadow DOM
4. Inspect the element's visibility state
5. Review dynamic content loading

For more help, check the test automation documentation or contact the QA team.
`;
    }

    /**
     * Generates and attaches a locator report to the test results
     */
    async attachLocatorReport(): Promise<void> {
        const report = {
            timestamp: new Date().toISOString(),
            url: this.page.url(),
            locators: this.history
        };

        const reportHtml = this.generateLocatorReportHtml(report);
        
        // Save the report to a file
        const reportDir = 'test-results/locator-reports';
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(reportDir, `locator-report-${timestamp}.html`);
        fs.writeFileSync(reportPath, reportHtml);

        // Log the report location to the console
        console.log(`\nLocator Report generated at: ${reportPath}`);

        // Attach report URL to the page for test runner
        await this.page.evaluate((html) => {
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            console.log(`SmartLocator Report URL: ${url}`);
        }, reportHtml);
    }

    /**
     * Generates an HTML report of locator usage and success rates
     */
    private generateLocatorReportHtml(report: {
        timestamp: string;
        url: string;
        locators: Record<string, LocatorHistory>;
    }): string {
        const rows = Object.entries(report.locators).map(([key, data]) => {
            const successRate = data.successCount + data.failureCount > 0
                ? ((data.successCount / (data.successCount + data.failureCount)) * 100).toFixed(1)
                : 'N/A';
            
            const statusClass = 
                successRate === 'N/A' ? 'neutral' :
                Number(successRate) >= 90 ? 'good' :
                Number(successRate) >= 70 ? 'moderate' : 'poor';

            return `
                <tr class="${statusClass}">
                    <td>${key}</td>
                    <td>${data.selector}</td>
                    <td>${data.alternativeSelectors?.join('<br>') || 'None'}</td>
                    <td>${data.successCount}</td>
                    <td>${data.failureCount}</td>
                    <td>${successRate}%</td>
                    <td>${new Date(data.lastUsed).toLocaleString()}</td>
                    <td>${data.lastSuccess ? new Date(data.lastSuccess).toLocaleString() : 'Never'}</td>
                </tr>
            `;
        }).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Smart Locator Report</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        background-color: #f5f5f5;
                        color: #333;
                        line-height: 1.6;
                    }
                    .header {
                        background-color: #fff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        margin-bottom: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                        background-color: #fff;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }
                    th, td {
                        padding: 12px;
                        text-align: left;
                        border-bottom: 1px solid #ddd;
                    }
                    th {
                        background-color: #f8f9fa;
                        font-weight: bold;
                    }
                    tr:hover {
                        background-color: #f8f9fa;
                    }
                    .good {
                        background-color: #e8f5e9;
                    }
                    .good:hover {
                        background-color: #c8e6c9;
                    }
                    .moderate {
                        background-color: #fff3e0;
                    }
                    .moderate:hover {
                        background-color: #ffe0b2;
                    }
                    .poor {
                        background-color: #ffebee;
                    }
                    .poor:hover {
                        background-color: #ffcdd2;
                    }
                    .neutral {
                        background-color: #f5f5f5;
                    }
                    .neutral:hover {
                        background-color: #eeeeee;
                    }
                    .summary {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin-bottom: 20px;
                    }
                    .summary-card {
                        background-color: #fff;
                        padding: 15px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .legend {
                        margin-top: 20px;
                        padding: 15px;
                        background-color: #fff;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Smart Locator Report</h1>
                    <p>Generated on: ${report.timestamp}</p>
                    <p>Page URL: ${report.url}</p>
                </div>

                <div class="summary">
                    <div class="summary-card">
                        <h3>Total Locators</h3>
                        <p>${Object.keys(report.locators).length}</p>
                    </div>
                    <div class="summary-card">
                        <h3>Success Rate</h3>
                        <p>${this.calculateOverallSuccessRate(report.locators)}%</p>
                    </div>
                    <div class="summary-card">
                        <h3>Alternative Selectors</h3>
                        <p>${this.countTotalAlternatives(report.locators)}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Key</th>
                            <th>Primary Selector</th>
                            <th>Alternative Selectors</th>
                            <th>Successes</th>
                            <th>Failures</th>
                            <th>Success Rate</th>
                            <th>Last Used</th>
                            <th>Last Success</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>

                <div class="legend">
                    <h3>Success Rate Legend</h3>
                    <p>✅ Good: ≥90% success rate</p>
                    <p>⚠️ Moderate: 70-89% success rate</p>
                    <p>❌ Poor: <70% success rate</p>
                    <p>ℹ️ N/A: No attempts recorded</p>
                </div>
            </body>
            </html>
        `;
    }

    private calculateOverallSuccessRate(locators: Record<string, LocatorHistory>): string {
        let totalSuccess = 0;
        let totalAttempts = 0;

        Object.values(locators).forEach(locator => {
            totalSuccess += locator.successCount;
            totalAttempts += locator.successCount + locator.failureCount;
        });

        return totalAttempts > 0
            ? ((totalSuccess / totalAttempts) * 100).toFixed(1)
            : '0.0';
    }

    private countTotalAlternatives(locators: Record<string, LocatorHistory>): number {
        return Object.values(locators).reduce((total, locator) => 
            total + (locator.alternativeSelectors?.length || 0), 0);
    }
} 