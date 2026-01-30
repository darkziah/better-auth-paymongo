import { mock, type Mock } from "bun:test";

// ============================================================
// Mock Database (In-Memory Storage)
// ============================================================
export interface MockDatabase {
    paymongoSession: Record<string, any>;
    paymongoUsage: Record<string, any>;
}

export let mockDb: MockDatabase;

export function resetMockDb() {
    mockDb = {
        paymongoSession: {},
        paymongoUsage: {},
    };
}

// ============================================================
// Comprehensive Mock Adapter (Handles all models)
// ============================================================
export function createMockAdapter() {
    return {
        findOne: mock(async <T>(params: {
            model: string;
            where: { field: string; value: string }[];
        }): Promise<T | null> => {
            const collection = mockDb[params.model as keyof MockDatabase];
            if (!collection) return null;

            for (const record of Object.values(collection)) {
                const matches = params.where.every(
                    (w) => record[w.field] === w.value
                );
                if (matches) return record as T;
            }
            return null;
        }),

        findMany: mock(async <T>(params: {
            model: string;
            where: { field: string; value: string }[];
        }): Promise<T[]> => {
            const collection = mockDb[params.model as keyof MockDatabase];
            if (!collection) return [];

            return Object.values(collection).filter((record) =>
                params.where.every((w) => record[w.field] === w.value)
            ) as T[];
        }),

        create: mock(async <T>(params: {
            model: string;
            data: Record<string, unknown>;
        }): Promise<T> => {
            const id = `${params.model}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const record = { id, ...params.data };
            const collection = mockDb[params.model as keyof MockDatabase];
            if (collection) {
                collection[id] = record;
            }
            return record as T;
        }),

        update: mock(async <T>(params: {
            model: string;
            where: { field: string; value: string }[];
            update: Record<string, unknown>;
        }): Promise<T | null> => {
            const collection = mockDb[params.model as keyof MockDatabase];
            if (!collection) return null;

            for (const [key, record] of Object.entries(collection)) {
                const matches = params.where.every(
                    (w) => record[w.field] === w.value
                );
                if (matches) {
                    collection[key] = { ...record, ...params.update };
                    return collection[key] as T;
                }
            }
            return null;
        }),

        delete: mock(async (params: {
            model: string;
            where: { field: string; value: string }[];
        }): Promise<void> => {
            const collection = mockDb[params.model as keyof MockDatabase];
            if (!collection) return;

            for (const [key, record] of Object.entries(collection)) {
                const matches = params.where.every(
                    (w) => record[w.field] === w.value
                );
                if (matches) {
                    delete collection[key];
                    return;
                }
            }
        }),
    };
}

// ============================================================
// Mock Fetch (PayMongo API)
// ============================================================
export function createMockFetchResponse(data: unknown, ok = true) {
    return {
        ok,
        json: async () => data,
        text: async () => JSON.stringify(data),
    } as Response;
}

// ============================================================
// Test Context Factory
// ============================================================
export function createMockCtx(
    adapter: ReturnType<typeof createMockAdapter>,
    overrides: {
        body?: Record<string, unknown>;
        query?: Record<string, unknown>;
        userId?: string;
    } = {}
) {
    const userId = overrides.userId || "user_123";
    return {
        context: {
            adapter,
            session: {
                user: { id: userId, email: "test@example.com" },
                session: { id: "session_123" },
            },
            options: { plugins: [] as any[] },
            logger: { error: console.error },
        },
        session: {
            user: { id: userId, email: "test@example.com" },
            session: { id: "session_123" },
        },
        body: overrides.body || {},
        query: overrides.query || {},
        headers: new Headers(),
        json: <T>(data: T) => data,
    };
}
