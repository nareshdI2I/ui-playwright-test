import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';

interface PerformanceReport {
    testFile: string;
    testName: string;
    browser: string;
    metrics: {
        timeToFirstByte: number;
        domContentLoaded: number;
        loadTime: number;
        firstContentfulPaint: number;
        largestContentfulPaint: number;
        firstInputDelay: number;
        totalBlockingTime: number;
        cumulativeLayoutShift: number;
    };
    timestamp: string;
}

interface ThresholdConfig {
    good: number;
    moderate: number;
}

const THRESHOLDS: Record<string, ThresholdConfig> = {
    timeToFirstByte: { good: 200, moderate: 500 },
    domContentLoaded: { good: 1000, moderate: 2500 },
    loadTime: { good: 2000, moderate: 4000 },
    firstContentfulPaint: { good: 1000, moderate: 2500 },
    largestContentfulPaint: { good: 2500, moderate: 4000 },
    firstInputDelay: { good: 100, moderate: 300 },
    totalBlockingTime: { good: 200, moderate: 600 },
    cumulativeLayoutShift: { good: 0.1, moderate: 0.25 }
};

export default class PerformanceReporter implements Reporter {
    private reports: PerformanceReport[] = [];

    onTestEnd(test: TestCase, result: TestResult) {
        const attachments = result.attachments;
        const perfMetrics = attachments.find(a => a.name === 'performance-metrics');
        
        if (perfMetrics && perfMetrics.body) {
            const metrics = JSON.parse(perfMetrics.body.toString());
            this.reports.push({
                testFile: test.location.file,
                testName: test.title,
                browser: test.parent.project()?.name || 'unknown',
                metrics,
                timestamp: new Date().toISOString()
            });
        }
    }

    async onEnd() {
        if (this.reports.length === 0) return;

        const reportDir = 'performance-reports';
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(reportDir, `performance-${timestamp}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(this.reports, null, 2));

        const htmlReport = this.generateHtmlReport();
        const htmlPath = path.join(reportDir, `performance-${timestamp}.html`);
        fs.writeFileSync(htmlPath, htmlReport);

        console.log(`\nPerformance report generated at ${reportPath}`);
        console.log(`HTML report generated at ${htmlPath}`);
    }

    private generateSummaryTable(): string {
        const metricAverages = this.calculateMetricAverages();
        const rows = Object.entries(metricAverages).map(([metric, value]) => {
            const status = this.getMetricStatus(metric, value);
            const formattedValue = this.formatMetricValue(metric, value);
            return `
                <tr class="metric-row ${status}">
                    <td class="metric-name">${metric}</td>
                    <td class="metric-value">${formattedValue}</td>
                    <td class="metric-status">${status.toUpperCase()}</td>
                </tr>
            `;
        }).join('');

        return `
            <div class="summary-section">
                <h2>Performance Summary (Averages)</h2>
                <table class="metrics-table">
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Average Value</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    private calculateMetricAverages(): Record<string, number> {
        const sums: Record<string, number> = {};
        const counts: Record<string, number> = {};

        this.reports.forEach(report => {
            Object.entries(report.metrics).forEach(([metric, value]) => {
                sums[metric] = (sums[metric] || 0) + value;
                counts[metric] = (counts[metric] || 0) + 1;
            });
        });

        const averages: Record<string, number> = {};
        Object.keys(sums).forEach(metric => {
            averages[metric] = sums[metric] / counts[metric];
        });

        return averages;
    }

    private formatMetricValue(name: string, value: number): string {
        if (name === 'cumulativeLayoutShift') {
            return value.toFixed(3);
        }
        return `${(value / 1000).toFixed(2)}s`;
    }

    private getMetricStatus(name: string, value: number): string {
        const threshold = THRESHOLDS[name];
        if (!threshold) return 'unknown';
        
        if (name === 'cumulativeLayoutShift') {
            if (value <= threshold.good) return 'good';
            if (value <= threshold.moderate) return 'moderate';
            return 'poor';
        }

        if (value <= threshold.good) return 'good';
        if (value <= threshold.moderate) return 'moderate';
        return 'poor';
    }

    private generateHtmlReport(): string {
        const summaryTable = this.generateSummaryTable();
        const detailedRows = this.reports.map(report => {
            const metricRows = Object.entries(report.metrics).map(([name, value]) => {
                const status = this.getMetricStatus(name, value);
                const formattedValue = this.formatMetricValue(name, value);
                return `
                    <tr class="metric-row ${status}">
                        <td class="metric-name">
                            ${name}
                            <div class="tooltip">${this.getMetricDescription(name)}</div>
                        </td>
                        <td class="metric-value">${formattedValue}</td>
                        <td class="metric-status">${status.toUpperCase()}</td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="test-section">
                    <h3>${report.testName}</h3>
                    <div class="test-info">
                        <p><strong>Browser:</strong> ${report.browser}</p>
                        <p><strong>File:</strong> ${report.testFile}</p>
                        <p><strong>Timestamp:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
                    </div>
                    <table class="metrics-table">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Value</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${metricRows}
                        </tbody>
                    </table>
                </div>
            `;
        }).join('<hr>');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Performance Test Report</title>
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
                    .summary-section {
                        background-color: #fff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        margin-bottom: 30px;
                    }
                    .test-section {
                        background-color: #fff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        margin-bottom: 20px;
                    }
                    .test-info {
                        background-color: #f8f9fa;
                        padding: 15px;
                        border-radius: 4px;
                        margin: 10px 0;
                    }
                    .metrics-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                        background-color: #fff;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }
                    .metrics-table th,
                    .metrics-table td {
                        padding: 12px 15px;
                        text-align: left;
                        border-bottom: 1px solid #ddd;
                    }
                    .metrics-table th {
                        background-color: #f8f9fa;
                        font-weight: bold;
                        color: #333;
                    }
                    .metric-row {
                        position: relative;
                    }
                    .metric-row:hover .tooltip {
                        display: block;
                    }
                    .tooltip {
                        display: none;
                        position: absolute;
                        background-color: #333;
                        color: #fff;
                        padding: 8px 12px;
                        border-radius: 4px;
                        font-size: 14px;
                        z-index: 1;
                        width: 250px;
                        left: 100%;
                        top: 50%;
                        transform: translateY(-50%);
                        margin-left: 10px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    .metric-row.good {
                        background-color: #e8f5e9;
                    }
                    .metric-row.moderate {
                        background-color: #fff3e0;
                    }
                    .metric-row.poor {
                        background-color: #ffebee;
                    }
                    .metric-status {
                        font-weight: bold;
                    }
                    .good .metric-status {
                        color: #2e7d32;
                    }
                    .moderate .metric-status {
                        color: #f57c00;
                    }
                    .poor .metric-status {
                        color: #c62828;
                    }
                    hr {
                        margin: 30px 0;
                        border: none;
                        border-top: 1px solid #ddd;
                    }
                    .legend {
                        margin-top: 20px;
                        padding: 20px;
                        background-color: #fff;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .legend h3 {
                        margin-top: 0;
                        color: #333;
                    }
                    .legend-item {
                        margin: 15px 0;
                        padding: 10px;
                        border-radius: 4px;
                        background-color: #f8f9fa;
                    }
                    .chart-container {
                        margin: 20px 0;
                        padding: 20px;
                        background-color: #fff;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Performance Test Report</h1>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                    <p>Total Tests: ${this.reports.length}</p>
                </div>

                ${summaryTable}

                <h2>Detailed Test Results</h2>
                ${detailedRows}

                <div class="legend">
                    <h3>Metric Thresholds</h3>
                    ${Object.entries(THRESHOLDS).map(([metric, threshold]) => `
                        <div class="legend-item">
                            <strong>${metric}:</strong>
                            <ul>
                                <li>Good: ≤ ${this.formatMetricValue(metric, threshold.good)}</li>
                                <li>Moderate: ≤ ${this.formatMetricValue(metric, threshold.moderate)}</li>
                                <li>Poor: > ${this.formatMetricValue(metric, threshold.moderate)}</li>
                            </ul>
                            <p><em>${this.getMetricDescription(metric)}</em></p>
                        </div>
                    `).join('')}
                </div>
            </body>
            </html>
        `;
    }

    private getMetricDescription(metric: string): string {
        const descriptions: Record<string, string> = {
            timeToFirstByte: 'Time until the first byte of response is received from the server',
            domContentLoaded: 'Time until the initial HTML document is completely loaded and parsed',
            loadTime: 'Time until all resources (images, stylesheets, scripts) are loaded',
            firstContentfulPaint: 'Time when the first content (text, image, etc.) is painted on the screen',
            largestContentfulPaint: 'Time when the largest content element becomes visible',
            firstInputDelay: 'Time from first user interaction to when the browser responds',
            totalBlockingTime: 'Sum of all time periods that blocked the main thread',
            cumulativeLayoutShift: 'Measure of how much the page layout shifts during loading'
        };
        return descriptions[metric] || 'No description available';
    }
} 