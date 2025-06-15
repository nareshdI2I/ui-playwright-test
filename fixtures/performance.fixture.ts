import { test as base } from '@playwright/test';
import { PerformanceService } from '../services/PerformanceService';

// Extend the test type to include performance monitoring
interface PerformanceFixture {
    performanceService: PerformanceService;
}

// Create a test fixture that includes performance monitoring
export const test = base.extend<PerformanceFixture>({
    performanceService: async ({ page }, use) => {
        const performanceService = new PerformanceService(page, 'test-results/performance-metrics.csv');
        await performanceService.initialize();
        await use(performanceService);
        await performanceService.dispose();
    }
});

export { expect } from '@playwright/test'; 