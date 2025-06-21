import { Reporter, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

export default class CustomReporter implements Reporter {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private reports: any[] = [];
    private startTime: number = Date.now();
    private readonly outputDir: string;

    constructor() {
        this.outputDir = path.join(process.cwd(), 'test-results');
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onBegin(config: any) {
        // eslint-disable-next-line no-console
        console.log(`Running tests with ${config.workers} workers`);
        this.startTime = Date.now();
    }

    onTestBegin(test: TestCase) {
        // eslint-disable-next-line no-console
        console.log(`Starting test: ${test.title}`);
    }

    onTestEnd(test: TestCase, result: TestResult) {
        const testReport = {
            title: test.title,
            status: result.status,
            duration: result.duration,
            error: result.error?.message,
            attachments: this.processAttachments(result),
            performance: this.getPerformanceMetrics(result),
        };

        this.reports.push(testReport);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onEnd(result: any) {
        const finalReport = {
            status: result.status,
            totalDuration: Date.now() - this.startTime,
            tests: this.reports,
            summary: this.generateSummary(),
        };

        // Save JSON report
        fs.writeFileSync(
            path.join(this.outputDir, 'test-report.json'),
            JSON.stringify(finalReport, null, 2)
        );

        // Generate HTML report
        this.generateHtmlReport(finalReport);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private processAttachments(result: TestResult): any[] {
        return result.attachments.map(attachment => ({
            name: attachment.name,
            contentType: attachment.contentType,
            path: attachment.path,
        }));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private getPerformanceMetrics(result: TestResult): any {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const metrics: any = {};
        
        if (result.steps) {
            result.steps.forEach((step: TestStep) => {
                if (step.category === 'network') {
                    // Collect network metrics
                    metrics.networkRequests = (metrics.networkRequests || 0) + 1;
                }
            });
        }

        return metrics;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private generateSummary(): any {
        const summary = {
            total: this.reports.length,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
        };

        this.reports.forEach(test => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            summary[test.status as keyof typeof summary]++;
            summary.duration += test.duration;
        });

        return summary;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private generateHtmlReport(report: any): void {
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test Execution Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; }
                .test { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
                .passed { border-left: 5px solid #4CAF50; }
                .failed { border-left: 5px solid #f44336; }
                .skipped { border-left: 5px solid #FFC107; }
                .attachment { margin: 5px 0; }
            </style>
        </head>
        <body>
            <h1>Test Execution Report</h1>
            <div class="summary">
                <h2>Summary</h2>
                <p>Total Tests: ${report.summary.total}</p>
                <p>Passed: ${report.summary.passed}</p>
                <p>Failed: ${report.summary.failed}</p>
                <p>Skipped: ${report.summary.skipped}</p>
                <p>Total Duration: ${(report.totalDuration / 1000).toFixed(2)}s</p>
            </div>
            <div class="tests">
                <h2>Test Results</h2>
                ${report.tests.map((test: any) => `
                    <div class="test ${test.status}">
                        <h3>${test.title}</h3>
                        <p>Status: ${test.status}</p>
                        <p>Duration: ${(test.duration / 1000).toFixed(2)}s</p>
                        ${test.error ? `<p class="error">Error: ${test.error}</p>` : ''}
                        ${test.attachments.length ? `
                            <div class="attachments">
                                <h4>Attachments</h4>
                                ${test.attachments.map((att: any) => `
                                    <div class="attachment">
                                        <p>${att.name} (${att.contentType})</p>
                                        ${att.contentType.startsWith('image/') ? 
                                            `<img src="${att.path}" style="max-width: 800px;">` : 
                                            `<a href="${att.path}">View Attachment</a>`
                                        }
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </body>
        </html>`;

        fs.writeFileSync(path.join(this.outputDir, 'test-report.html'), html);
    }
}