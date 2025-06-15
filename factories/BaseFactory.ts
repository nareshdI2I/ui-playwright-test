import { faker } from '@faker-js/faker';

export abstract class BaseFactory<T> {
    protected faker = faker;

    /**
     * Create a single instance
     */
    abstract create(overrides?: Partial<T>): T;

    /**
     * Create multiple instances
     */
    createMany(count: number, overrides?: Partial<T>): T[] {
        return Array.from({ length: count }, () => this.create(overrides));
    }

    /**
     * Create an instance with specific attributes
     */
    createWith(attributes: Partial<T>): T {
        return this.create(attributes);
    }

    /**
     * Create a minimal valid instance
     */
    abstract createMinimal(): T;

    /**
     * Create an invalid instance for testing validation
     */
    abstract createInvalid(): Partial<T>;

    /**
     * Merge overrides with default values
     */
    protected mergeWithOverrides<K extends object>(defaults: K, overrides?: Partial<K>): K {
        return {
            ...defaults,
            ...overrides
        };
    }

    /**
     * Generate a random enum value
     */
    protected randomEnum<E>(enumObj: { [s: string]: E }): E {
        const enumValues = Object.values(enumObj);
        const randomIndex = Math.floor(Math.random() * enumValues.length);
        return enumValues[randomIndex];
    }
} 