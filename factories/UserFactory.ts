import { BaseFactory } from './BaseFactory';
import { User, UserRole, UserStatus, Address, UserProfile } from '../models/User';

export class UserFactory extends BaseFactory<User> {
    create(overrides?: Partial<User>): User {
        const firstName = this.faker.person.firstName();
        const lastName = this.faker.person.lastName();
        const email = this.faker.internet.email({ firstName, lastName });

        const defaults: User = {
            id: this.faker.string.uuid(),
            email,
            username: this.faker.internet.userName({ firstName, lastName }),
            password: this.faker.internet.password({ length: 12 }),
            role: this.randomEnum(UserRole),
            status: UserStatus.ACTIVE,
            profile: this.createProfile({ firstName, lastName }),
            createdAt: this.faker.date.past(),
            updatedAt: this.faker.date.recent(),
            lastLoginAt: this.faker.date.recent(),
            preferences: {
                theme: this.faker.helpers.arrayElement(['light', 'dark']),
                notifications: this.faker.datatype.boolean(),
                language: this.faker.helpers.arrayElement(['en', 'es', 'fr'])
            }
        };

        return this.mergeWithOverrides(defaults, overrides);
    }

    createMinimal(): User {
        return this.create({
            role: UserRole.USER,
            status: UserStatus.ACTIVE,
            preferences: undefined,
            lastLoginAt: undefined
        });
    }

    createInvalid(): Partial<User> {
        return {
            email: 'invalid-email',
            password: this.faker.internet.password({ length: 2 }), // Too short but generated
            role: 'invalid-role' as UserRole,
            status: 'invalid-status' as UserStatus
        };
    }

    createAdmin(overrides?: Partial<User>): User {
        return this.create({
            role: UserRole.ADMIN,
            ...overrides
        });
    }

    createGuest(overrides?: Partial<User>): User {
        return this.create({
            role: UserRole.GUEST,
            status: UserStatus.PENDING,
            ...overrides
        });
    }

    private createProfile(nameOverrides?: { firstName?: string; lastName?: string }): UserProfile {
        return {
            firstName: nameOverrides?.firstName ?? this.faker.person.firstName(),
            lastName: nameOverrides?.lastName ?? this.faker.person.lastName(),
            phoneNumber: this.faker.phone.number(),
            dateOfBirth: this.faker.date.birthdate(),
            address: this.createAddress(),
            avatar: this.faker.image.avatar(),
            bio: this.faker.person.bio()
        };
    }

    private createAddress(): Address {
        return {
            street: this.faker.location.streetAddress(),
            city: this.faker.location.city(),
            state: this.faker.location.state(),
            zipCode: this.faker.location.zipCode(),
            country: this.faker.location.country()
        };
    }
} 