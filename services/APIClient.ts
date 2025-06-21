import { APIRequestContext, APIResponse, request } from '@playwright/test';
import { config } from '../config/env.config';

export class APIClient {
    private request!: APIRequestContext;
    private authToken?: string;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        this.request = await request.newContext({
            baseURL: config.apiUrl,
            extraHTTPHeaders: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
    }

    protected async setAuthToken(token: string) {
        this.authToken = token;
    }

    protected getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        return headers;
    }

    protected async handleResponse<T>(response: APIResponse): Promise<T> {
        if (!response.ok()) {
            throw new Error(`API request failed: ${response.statusText()} (${response.status()})`);
        }

        const contentType = response.headers()['content-type'];
        if (contentType && contentType.includes('application/json')) {
            return response.json() as Promise<T>;
        }

        throw new Error(`Unexpected content type: ${contentType}`);
    }

    async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
        const searchParams = params ? new URLSearchParams(params).toString() : '';
        const queryString = searchParams ? `?${searchParams}` : '';
        const url = endpoint + queryString;
        
        const response = await this.request.get(url, {
            headers: this.getHeaders()
        });

        return this.handleResponse<T>(response);
    }

    async post<T>(endpoint: string, data: unknown): Promise<T> {
        const response = await this.request.post(endpoint, {
            headers: this.getHeaders(),
            data
        });

        return this.handleResponse<T>(response);
    }

    async put<T>(endpoint: string, data: unknown): Promise<T> {
        const response = await this.request.put(endpoint, {
            headers: this.getHeaders(),
            data
        });

        return this.handleResponse<T>(response);
    }

    async delete(endpoint: string): Promise<void> {
        const response = await this.request.delete(endpoint, {
            headers: this.getHeaders()
        });

        await this.handleResponse<void>(response);
    }

    async dispose() {
        await this.request.dispose();
    }
} 