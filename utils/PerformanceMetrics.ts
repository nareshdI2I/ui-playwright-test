import { Page } from '@playwright/test';

export interface PerformanceMetrics {
    timeToFirstByte: number;
    domContentLoaded: number;
    loadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    totalBlockingTime: number;
    cumulativeLayoutShift: number;
}

export class PerformanceService {
    constructor(private page: Page) {}

    async captureNavigationMetrics(): Promise<PerformanceMetrics> {
        const navigationTimings = await this.page.evaluate(() => {
            const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            return {
                timeToFirstByte: timing.responseStart - timing.requestStart,
                domContentLoaded: timing.domContentLoadedEventEnd - timing.requestStart,
                loadTime: timing.loadEventEnd - timing.requestStart
            };
        });

        const paintTimings = await this.page.evaluate(() => {
            const paint = performance.getEntriesByType('paint');
            const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
            return {
                firstContentfulPaint: fcp
            };
        });

        const lcpTiming = await this.page.evaluate(() => {
            const lcp = performance.getEntriesByType('largest-contentful-paint');
            return {
                largestContentfulPaint: lcp.length > 0 ? lcp[lcp.length - 1].startTime : 0
            };
        });

        const layoutShift = await this.page.evaluate(() => {
            const cls = performance.getEntriesByType('layout-shift');
            return {
                cumulativeLayoutShift: cls.reduce((total, entry) => total + entry.value, 0)
            };
        });

        const firstInputDelay = await this.page.evaluate(() => {
            const fid = performance.getEntriesByType('first-input');
            return {
                firstInputDelay: fid.length > 0 ? fid[0].processingStart - fid[0].startTime : 0
            };
        });

        const blockingTime = await this.page.evaluate(() => {
            const longTasks = performance.getEntriesByType('longtask');
            return {
                totalBlockingTime: longTasks.reduce((total, task) => total + task.duration, 0)
            };
        });

        return {
            ...navigationTimings,
            ...paintTimings,
            ...lcpTiming,
            ...layoutShift,
            ...firstInputDelay,
            ...blockingTime
        };
    }
} 