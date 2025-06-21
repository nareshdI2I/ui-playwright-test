/// <reference lib="dom" />
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
            const timing = performance.getEntriesByType('navigation')[0];
            return {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                timeToFirstByte: timing && typeof (timing as any).responseStart === 'number' && typeof (timing as any).requestStart === 'number' ? (timing as any).responseStart - (timing as any).requestStart : 0,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                domContentLoaded: timing && typeof (timing as any).domContentLoadedEventEnd === 'number' && typeof (timing as any).requestStart === 'number' ? (timing as any).domContentLoadedEventEnd - (timing as any).requestStart : 0,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                loadTime: timing && typeof (timing as any).loadEventEnd === 'number' && typeof (timing as any).requestStart === 'number' ? (timing as any).loadEventEnd - (timing as any).requestStart : 0
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
            const cls = performance.getEntriesByType('layout-shift') as PerformanceEntry[];
            return {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                cumulativeLayoutShift: cls.reduce((total, entry) => total + (typeof (entry as any).value === 'number' ? (entry as any).value : 0), 0)
            };
        });

        const firstInputDelay = await this.page.evaluate(() => {
            const fid = performance.getEntriesByType('first-input');
            return {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                firstInputDelay: fid.length > 0 && typeof (fid[0] as any).processingStart === 'number' && typeof (fid[0] as any).startTime === 'number' ? (fid[0] as any).processingStart - (fid[0] as any).startTime : 0
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