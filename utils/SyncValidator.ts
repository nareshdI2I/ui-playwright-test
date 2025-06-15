import { expect } from '@playwright/test';
import { User } from '../models/User';

export class SyncValidator {
    /**
     * Compare UI user data with API user data
     */
    static async validateUserSync(uiData: Partial<User>, apiData: User): Promise<void> {
        // Compare basic user information
        if (uiData.email) {
            expect(uiData.email).toBe(apiData.email);
        }
        if (uiData.username) {
            expect(uiData.username).toBe(apiData.username);
        }
        if (uiData.role) {
            expect(uiData.role).toBe(apiData.role);
        }
        if (uiData.status) {
            expect(uiData.status).toBe(apiData.status);
        }

        // Compare profile information if available
        if (uiData.profile) {
            if (uiData.profile.firstName) {
                expect(uiData.profile.firstName).toBe(apiData.profile.firstName);
            }
            if (uiData.profile.lastName) {
                expect(uiData.profile.lastName).toBe(apiData.profile.lastName);
            }
            if (uiData.profile.phoneNumber) {
                expect(uiData.profile.phoneNumber).toBe(apiData.profile.phoneNumber);
            }
        }
    }

    /**
     * Compare UI list data with API paginated response
     */
    static async validateListSync<T>(
        uiItems: T[],
        apiResponse: { data: T[]; total: number },
        compareItem: (uiItem: T, apiItem: T) => boolean
    ): Promise<void> {
        // Check if the number of visible items matches
        expect(uiItems.length).toBeLessThanOrEqual(apiResponse.total);

        // Compare each visible item
        for (const uiItem of uiItems) {
            const matchingApiItem = apiResponse.data.find(apiItem => 
                compareItem(uiItem, apiItem)
            );
            expect(matchingApiItem).toBeTruthy();
        }
    }

    /**
     * Validate form error messages
     */
    static async validateFormErrors(
        uiErrors: Record<string, string>,
        apiErrors: Record<string, string[]>
    ): Promise<void> {
        for (const [field, message] of Object.entries(uiErrors)) {
            expect(apiErrors[field]).toBeDefined();
            expect(apiErrors[field]).toContain(message);
        }
    }

    /**
     * Compare timestamps within a reasonable threshold
     */
    static validateTimestampSync(
        uiTimestamp: Date | string,
        apiTimestamp: Date | string,
        thresholdMs: number = 5000
    ): void {
        const uiTime = new Date(uiTimestamp).getTime();
        const apiTime = new Date(apiTimestamp).getTime();
        const difference = Math.abs(uiTime - apiTime);
        
        expect(difference).toBeLessThanOrEqual(thresholdMs);
    }

    /**
     * Validate pagination state
     */
    static validatePaginationSync(
        uiPagination: { page: number; limit: number; total: number },
        apiPagination: { page: number; limit: number; total: number }
    ): void {
        expect(uiPagination.page).toBe(apiPagination.page);
        expect(uiPagination.limit).toBe(apiPagination.limit);
        expect(uiPagination.total).toBe(apiPagination.total);
    }
} 