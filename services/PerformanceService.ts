import { Page, CDPSession } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';

interface PerformanceMetrics {
    timestamp: number;
    url: string;
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    scriptDuration: number;
    layoutDuration: number;
    taskDuration: number;
    JSHeapUsage: number;
    nodes: number;
}

export class PerformanceService {
    private page: Page;
    private client: CDPSession;
    private metricsBuffer: PerformanceMetrics[] = [];
    private readonly outputPath: string;

    constructor(page: Page, outputPath: string = 'performance-metrics.csv') {
        this.page = page;
        this.outputPath = outputPath;
    }

    async initialize(): Promise<void> {
        // Connect to CDP
        this.client = await this.page.context().newCDPSession(this.page);
        
        // Enable necessary domains
        await Promise.all([
            this.client.send('Performance.enable'),
            this.client.send('PerformanceTimeline.enable', {
                timeDomain: 'timeTicks'
            })
        ]);
    }

    async captureMetrics(): Promise<PerformanceMetrics> {
        // Get metrics from CDP
        const cdpMetrics = await this.client.send('Performance.getMetrics');
        const navigationTiming: any = await this.page.evaluate(() => {
            const timing = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');
            const lcp = performance.getEntriesByType('largest-contentful-paint').slice(-1)[0];
            
            return {
                navigationStart: timing.startTime,
                loadTime: timing.loadEventEnd - timing.startTime,
                domContentLoaded: timing.domContentLoadedEventEnd - timing.startTime,
                firstContentfulPaint: paint.find((p: any) => p.name === 'first-contentful-paint')?.startTime,
                largestContentfulPaint: lcp?.startTime
            };
        });

        // Extract relevant metrics
        const metrics: PerformanceMetrics = {
            timestamp: Date.now(),
            url: this.page.url(),
            loadTime: navigationTiming.loadTime,
            domContentLoaded: navigationTiming.domContentLoaded,
            firstContentfulPaint: navigationTiming.firstContentfulPaint,
            largestContentfulPaint: navigationTiming.largestContentfulPaint,
            scriptDuration: this.findMetric(cdpMetrics.metrics, 'ScriptDuration'),
            layoutDuration: this.findMetric(cdpMetrics.metrics, 'LayoutDuration'),
            taskDuration: this.findMetric(cdpMetrics.metrics, 'TaskDuration'),
            JSHeapUsage: this.findMetric(cdpMetrics.metrics, 'JSHeapUsedSize'),
            nodes: this.findMetric(cdpMetrics.metrics, 'Nodes')
        };

        this.metricsBuffer.push(metrics);
        return metrics;
    }

    private findMetric(metrics: any[], name: string): number {
        const metric = metrics.find(m => m.name === name);
        return metric ? metric.value : 0;
    }

    async saveMetricsToCSV(): Promise<void> {
        if (this.metricsBuffer.length === 0) return;

        const headers = Object.keys(this.metricsBuffer[0]).join(',');
        const rows = this.metricsBuffer.map(metric => 
            Object.values(metric).join(',')
        );

        const csvContent = [headers, ...rows].join('\n');
        
        // Ensure directory exists
        const dir = path.dirname(this.outputPath);
        await fs.mkdir(dir, { recursive: true });
        
        // Write to file
        await fs.writeFile(this.outputPath, csvContent, 'utf-8');
    }

    async dispose(): Promise<void> {
        if (this.client) {
            await this.client.detach();
        }
        await this.saveMetricsToCSV();
    }
} 