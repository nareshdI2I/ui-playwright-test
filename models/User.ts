export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
    GUEST = 'guest'
}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    PENDING = 'pending',
    BLOCKED = 'blocked'
}

export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export interface UserProfile {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth: Date;
    address: Address;
    avatar?: string;
    bio?: string;
}

export interface User {
    id: string;
    email: string;
    username: string;
    password: string;
    role: UserRole;
    status: UserStatus;
    profile: UserProfile;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    preferences?: {
        theme: 'light' | 'dark';
        notifications: boolean;
        language: string;
    };
} 