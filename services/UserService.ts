import { APIClient } from './APIClient';
import { User, UserRole, UserStatus } from '../models/User';

interface LoginResponse {
    token: string;
    user: User;
}

interface UserSearchParams {
    role?: UserRole;
    status?: UserStatus;
    email?: string;
    page?: number;
    limit?: number;
}

interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export class UserService extends APIClient {
    private static instance: UserService;

    private constructor() {
        super();
    }

    static getInstance(): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }

    async login(email: string, password: string): Promise<LoginResponse> {
        const response = await this.post<LoginResponse>('/auth/login', {
            email,
            password
        });

        // Set the auth token for subsequent requests
        await this.setAuthToken(response.token);
        return response;
    }

    async getCurrentUser(): Promise<User> {
        return this.get<User>('/users/me');
    }

    async createUser(userData: Partial<User>): Promise<User> {
        return this.post<User>('/users', userData);
    }

    async updateUser(userId: string, userData: Partial<User>): Promise<User> {
        return this.put<User>(`/users/${userId}`, userData);
    }

    async deleteUser(userId: string): Promise<void> {
        return this.delete(`/users/${userId}`);
    }

    async searchUsers(params: UserSearchParams): Promise<PaginatedResponse<User>> {
        return this.get<PaginatedResponse<User>>('/users', params as Record<string, string>);
    }

    async getUserById(userId: string): Promise<User> {
        return this.get<User>(`/users/${userId}`);
    }

    async validateUserCredentials(email: string, password: string): Promise<boolean> {
        try {
            await this.post<{ valid: boolean }>('/auth/validate', {
                email,
                password
            });
            return true;
        } catch {
            return false;
        }
    }

    async resetPassword(email: string): Promise<void> {
        await this.post('/auth/reset-password', { email });
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await this.post('/auth/change-password', {
            currentPassword,
            newPassword
        });
    }

    async logout(): Promise<void> {
        await this.post('/auth/logout', {});
        await this.setAuthToken('');
    }
} 