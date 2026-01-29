export declare const cache: {
    get<T>(key: string): T | null;
    set<T>(key: string, value: T, ttlSeconds?: number): void;
    delete(key: string): void;
    clear(): void;
};
