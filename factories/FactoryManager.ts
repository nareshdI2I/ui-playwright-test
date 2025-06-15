import { faker, Faker, allLocales } from '@faker-js/faker';
import { UserFactory } from './UserFactory';

export class FactoryManager {
    private static instance: FactoryManager;
    private userFactory: UserFactory;

    private constructor() {
        // Initialize factories
        this.userFactory = new UserFactory();
    }

    /**
     * Get singleton instance
     */
    static getInstance(): FactoryManager {
        if (!FactoryManager.instance) {
            FactoryManager.instance = new FactoryManager();
        }
        return FactoryManager.instance;
    }

    /**
     * Get user factory
     */
    user(): UserFactory {
        return this.userFactory;
    }

    /**
     * Reset faker seed
     */
    setSeed(seed: number): void {
        faker.seed(seed);
    }

    /**
     * Change faker locale
     */
    setLocale(locale: string): void {
        // Create a new Faker instance with the specified locale
        const newFaker = new Faker({
            locale: [allLocales[locale]]
        });
        Object.assign(faker, newFaker);
    }
} 