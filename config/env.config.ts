import dotenv from 'dotenv';
import path from 'path';

// Load environment-specific .env file
const env = process.env.TEST_ENV || 'dev';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${env}`) });

export interface EnvironmentConfig {
    baseUrl: string;
    apiUrl: string;
    credentials: {
        admin: { username: string; password: string };
        user: { username: string; password: string };
    };
    timeouts: {
        default: number;
        navigation: number;
        element: number;
    };
}

const environments: Record<string, EnvironmentConfig> = {
    dev: {
        baseUrl: 'https://demoqa.com',
        apiUrl: 'http://localhost:3001/api',
        credentials: {
            admin: {
                username: process.env.DEV_ADMIN_USERNAME || 'admin@test.com',
                password: process.env.DEV_ADMIN_PASSWORD || 'admin123'
            },
            user: {
                username: process.env.DEV_USER_USERNAME || 'user@test.com',
                password: process.env.DEV_USER_PASSWORD || 'user123'
            }
        },
        timeouts: {
            default: 30000,
            navigation: 45000,
            element: 15000
        }
    },
    staging: {
        baseUrl: 'https://staging.yourapp.com',
        apiUrl: 'https://staging-api.yourapp.com',
        credentials: {
            admin: {
                username: process.env.STAGING_ADMIN_USERNAME || '',
                password: process.env.STAGING_ADMIN_PASSWORD || ''
            },
            user: {
                username: process.env.STAGING_USER_USERNAME || '',
                password: process.env.STAGING_USER_PASSWORD || ''
            }
        },
        timeouts: {
            default: 40000,
            navigation: 60000,
            element: 20000
        }
    },
    prod: {
        baseUrl: 'https://yourapp.com',
        apiUrl: 'https://api.yourapp.com',
        credentials: {
            admin: {
                username: process.env.PROD_ADMIN_USERNAME || '',
                password: process.env.PROD_ADMIN_PASSWORD || ''
            },
            user: {
                username: process.env.PROD_USER_USERNAME || '',
                password: process.env.PROD_USER_PASSWORD || ''
            }
        },
        timeouts: {
            default: 45000,
            navigation: 60000,
            element: 20000
        }
    }
};

export const config = environments[env];
if (!config) {
    throw new Error(`Environment '${env}' is not configured`);
}

// Export current environment name
export const currentEnv = env; 