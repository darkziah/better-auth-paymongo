import { describe, it, expect, mock, beforeEach, afterAll, type Mock } from "bun:test";
import { paymongo } from "../server";
import type { PaymongoAutumnConfig, PlanConfig, FeatureConfig } from "../types";
import {
    type MockDatabase,
    mockDb,
    resetMockDb,
    createMockAdapter,
    createMockFetchResponse,
    createMockCtx,
} from "./utils";

// Store original fetch
const originalFetch = global.fetch;

// Local mutable mock fetch for tests
let mockFetch: Mock<(...args: any[]) => Promise<Response>>;

// ============================================================
// Test Configuration
// ============================================================
const testConfig: PaymongoAutumnConfig<
    Record<string, PlanConfig>,
    Record<string, FeatureConfig>
> = {
    secretKey: "sk_test_user_billing",
    scopes: ["user", "organization"],
    features: {
        storage: { type: "metered", limit: 5 },
        ai_features: { type: "boolean" },
        team_members: { type: "metered", limit: 1 },
    },
    plans: {
        personal_free: {
            amount: 0,
            currency: "PHP",
            displayName: "Personal Free",
            interval: "monthly",
            features: { storage: 5, ai_features: false, team_members: 1 },
        },
        personal_pro: {
            amount: 49900,
            currency: "PHP",
            displayName: "Personal Pro",
            interval: "monthly",
            features: { storage: 100, ai_features: true, team_members: 5 },
        },
        personal_premium: {
            amount: 149900,
            currency: "PHP",
            displayName: "Personal Premium",
            interval: "yearly",
            features: { storage: 500, ai_features: true, team_members: 20 },
        },
    },
};

// ============================================================
// Helper: Seed Usage Record
// ============================================================
function seedUsageRecord(
    overrides: Partial<{
        entityType: "user" | "organization";
        entityId: string;
        featureId: string;
        balance: number;
        limit: number;
        planId: string;
        periodStart: Date;
        periodEnd: Date;
        checkoutSessionId: string;
    }> & {
        entityType: "user" | "organization";
        entityId: string;
        featureId: string;
    }
) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const record = {
        id: `usage_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        entityType: overrides.entityType,
        entityId: overrides.entityId,
        featureId: overrides.featureId,
        balance: overrides.balance ?? 10,
        limit: overrides.limit ?? 10,
        periodStart: overrides.periodStart ?? now,
        periodEnd: overrides.periodEnd ?? periodEnd,
        planId: overrides.planId ?? "personal_pro",
        checkoutSessionId: overrides.checkoutSessionId ?? "cs_user_123",
        createdAt: now,
        updatedAt: now,
    };

    mockDb.paymongoUsage[record.id] = record;
    return record;
}

// ============================================================
// Helper: Seed PayMongo Session
// ============================================================
function seedPaymongoSession(overrides: Partial<{
    sessionId: string;
    referenceId: string;
    entityType: "user" | "organization";
    entityId: string;
    planId: string;
    status: "pending" | "completed";
}> = {}) {
    const record = {
        id: `session_${Date.now()}`,
        sessionId: overrides.sessionId ?? `cs_${Date.now()}`,
        referenceId: overrides.referenceId ?? `ref_${Date.now()}`,
        entityType: overrides.entityType ?? "user",
        entityId: overrides.entityId ?? "user_123",
        planId: overrides.planId ?? "personal_pro",
        status: overrides.status ?? "pending",
        createdAt: new Date(),
    };

    mockDb.paymongoSession[record.id] = record;
    return record;
}

// ============================================================
// User-Scoped Billing Tests
// ============================================================
describe("User-Scoped Billing", () => {
    let mockAdapter: ReturnType<typeof createMockAdapter>;
    let plugin: ReturnType<typeof paymongo>;

    beforeEach(() => {
        resetMockDb();
        mockAdapter = createMockAdapter();
        plugin = paymongo(testConfig);

        mockFetch = mock();
        global.fetch = mockFetch as unknown as typeof fetch;
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    // ============================================================
    // User Session Context
    // ============================================================
    describe("User Session Context", () => {
        it("should use session.user.id when no organizationId provided", async () => {
            mockFetch.mockResolvedValueOnce(
                createMockFetchResponse({
                    data: {
                        id: "cs_user_checkout",
                        attributes: {
                            checkout_url: "https://checkout.paymongo.com/cs_user_checkout",
                        },
                    },
                })
            );

            const ctx = createMockCtx(mockAdapter, {
                userId: "alice_user_id",
                body: {
                    planId: "personal_pro",
                    successUrl: "https://myapp.com/success",
                    cancelUrl: "https://myapp.com/cancel",
                    // organizationId intentionally omitted
                },
            });

            // @ts-ignore
            await plugin.endpoints.attach(ctx);

            const sessions = Object.values(mockDb.paymongoSession);
            expect(sessions.length).toBe(1);
            expect(sessions[0].entityType).toBe("user");
            expect(sessions[0].entityId).toBe("alice_user_id");
        });

        it("should properly extract user context from session", async () => {
            seedUsageRecord({
                entityType: "user",
                entityId: "bob_user_id",
                featureId: "storage",
                balance: 50,
                limit: 100,
            });

            const ctx = createMockCtx(mockAdapter, {
                userId: "bob_user_id",
                query: { feature: "storage" },
            });

            // @ts-ignore
            const result = await plugin.endpoints.check(ctx);

            expect(result.allowed).toBe(true);
            expect(result.balance).toBe(50);
        });
    });

    // ============================================================
    // User-Scoped Billing Lifecycle
    // ============================================================
    describe("User-Scoped Billing Lifecycle", () => {
        it("should attach plan with entityType: user when no organizationId", async () => {
            mockFetch.mockResolvedValueOnce(
                createMockFetchResponse({
                    data: {
                        id: "cs_user_plan_attach",
                        attributes: {
                            checkout_url: "https://checkout.paymongo.com/cs_user_plan_attach",
                        },
                    },
                })
            );

            const ctx = createMockCtx(mockAdapter, {
                userId: "user_charlie",
                body: {
                    planId: "personal_premium",
                    successUrl: "https://myapp.com/success",
                    cancelUrl: "https://myapp.com/cancel",
                },
            });

            // @ts-ignore
            const result = await plugin.endpoints.attach(ctx);

            expect(result.checkoutUrl).toBe("https://checkout.paymongo.com/cs_user_plan_attach");

            const sessions = Object.values(mockDb.paymongoSession);
            expect(sessions[0].entityType).toBe("user");
            expect(sessions[0].entityId).toBe("user_charlie");
            expect(sessions[0].planId).toBe("personal_premium");
        });

        it("should verify payment and create usage records for user", async () => {
            const session = seedPaymongoSession({
                referenceId: "ref_user_verify",
                planId: "personal_pro",
                entityType: "user",
                entityId: "user_diana",
                status: "pending",
            });

            mockFetch.mockResolvedValueOnce(
                createMockFetchResponse({
                    data: {
                        attributes: { payment_status: "paid" },
                    },
                })
            );

            const ctx = createMockCtx(mockAdapter, {
                userId: "user_diana",
                body: { ref: "ref_user_verify" },
            });

            // @ts-ignore
            const result = await plugin.endpoints.verify(ctx);

            expect(result.success).toBe(true);
            expect(result.planId).toBe("personal_pro");

            // Verify user-scoped usage records created
            const usageRecords = Object.values(mockDb.paymongoUsage);
            const userRecords = usageRecords.filter(
                (r) => r.entityType === "user" && r.entityId === "user_diana"
            );
            expect(userRecords.length).toBeGreaterThanOrEqual(1);

            const storageUsage = userRecords.find((r) => r.featureId === "storage");
            expect(storageUsage).toBeDefined();
            expect(storageUsage?.limit).toBe(100); // personal_pro limit
        });

        it("should check user feature access and return user balance", async () => {
            seedUsageRecord({
                entityType: "user",
                entityId: "user_eve",
                featureId: "team_members",
                balance: 3,
                limit: 5,
                planId: "personal_pro",
            });

            const ctx = createMockCtx(mockAdapter, {
                userId: "user_eve",
                query: { feature: "team_members" },
            });

            // @ts-ignore
            const result = await plugin.endpoints.check(ctx);

            expect(result.allowed).toBe(true);
            expect(result.balance).toBe(3);
            expect(result.limit).toBe(5);
        });

        it("should track usage and decrement user balance", async () => {
            seedUsageRecord({
                entityType: "user",
                entityId: "user_frank",
                featureId: "storage",
                balance: 100,
                limit: 100,
            });

            const ctx = createMockCtx(mockAdapter, {
                userId: "user_frank",
                body: { feature: "storage", delta: 10 },
            });

            // @ts-ignore
            const result = await plugin.endpoints.track(ctx);

            expect(result.success).toBe(true);
            expect(result.balance).toBe(90);
            expect(result.limit).toBe(100);
        });

        it("should upgrade plan and carry over consumed usage", async () => {
            // User consumed 3 of 5 storage on personal_free plan
            seedUsageRecord({
                entityType: "user",
                entityId: "user_grace",
                featureId: "storage",
                balance: 2, // 3 consumed
                limit: 5,
                planId: "personal_free",
            });

            const session = seedPaymongoSession({
                referenceId: "ref_user_upgrade",
                planId: "personal_pro", // Upgrading to personal_pro
                entityType: "user",
                entityId: "user_grace",
            });

            mockFetch.mockResolvedValueOnce(
                createMockFetchResponse({
                    data: { attributes: { payment_status: "paid" } },
                })
            );

            const ctx = createMockCtx(mockAdapter, {
                userId: "user_grace",
                body: { ref: "ref_user_upgrade" },
            });

            // @ts-ignore
            await plugin.endpoints.verify(ctx);

            // Find the new storage usage record
            const usageRecords = Object.values(mockDb.paymongoUsage);
            const storageUsage = usageRecords.find((r) => r.featureId === "storage");

            // personal_pro has 100 limit, user consumed 3, so balance should be 97
            expect(storageUsage?.limit).toBe(100);
            expect(storageUsage?.balance).toBe(97);
        });
    });

    // ============================================================
    // User vs Organization Isolation
    // ============================================================
    describe("User vs Organization Isolation", () => {
        it("should keep user billing separate from organization billing", async () => {
            // User billing
            seedUsageRecord({
                entityType: "user",
                entityId: "user_hank",
                featureId: "storage",
                balance: 50,
                limit: 100,
                planId: "personal_pro",
            });

            // Organization billing
            seedUsageRecord({
                entityType: "organization",
                entityId: "org_hank_company",
                featureId: "storage",
                balance: 200,
                limit: 500,
                planId: "personal_premium",
            });

            // Check user billing
            const userCtx = createMockCtx(mockAdapter, {
                userId: "user_hank",
                query: { feature: "storage" },
            });

            // @ts-ignore
            const userResult = await plugin.endpoints.check(userCtx);
            expect(userResult.balance).toBe(50);
            expect(userResult.limit).toBe(100);

            // Check organization billing
            const orgCtx = createMockCtx(mockAdapter, {
                userId: "user_hank",
                query: { feature: "storage", organizationId: "org_hank_company" },
            });

            // @ts-ignore
            const orgResult = await plugin.endpoints.check(orgCtx);
            expect(orgResult.balance).toBe(200);
            expect(orgResult.limit).toBe(500);
        });

        it("should allow same user to have different plans for personal vs org", async () => {
            seedUsageRecord({
                entityType: "user",
                entityId: "user_iris",
                featureId: "storage",
                balance: 5,
                limit: 5,
                planId: "personal_free",
            });

            seedUsageRecord({
                entityType: "organization",
                entityId: "org_iris_startup",
                featureId: "storage",
                balance: 500,
                limit: 500,
                planId: "personal_premium",
            });

            const usageRecords = Object.values(mockDb.paymongoUsage);
            const userUsage = usageRecords.find(
                (r) => r.entityType === "user" && r.entityId === "user_iris"
            );
            const orgUsage = usageRecords.find(
                (r) => r.entityType === "organization" && r.entityId === "org_iris_startup"
            );

            expect(userUsage?.planId).toBe("personal_free");
            expect(orgUsage?.planId).toBe("personal_premium");
        });
    });

    // ============================================================
    // Multiple Users Independence
    // ============================================================
    describe("Multiple Users Independence", () => {
        it("should maintain independent usage records for different users", async () => {
            // User A
            seedUsageRecord({
                entityType: "user",
                entityId: "user_alice",
                featureId: "storage",
                balance: 10,
                limit: 100,
            });

            // User B
            seedUsageRecord({
                entityType: "user",
                entityId: "user_bob",
                featureId: "storage",
                balance: 50,
                limit: 100,
            });

            // Check User A
            const ctxA = createMockCtx(mockAdapter, {
                userId: "user_alice",
                query: { feature: "storage" },
            });

            // @ts-ignore
            const resultA = await plugin.endpoints.check(ctxA);
            expect(resultA.balance).toBe(10);

            // Check User B
            const ctxB = createMockCtx(mockAdapter, {
                userId: "user_bob",
                query: { feature: "storage" },
            });

            // @ts-ignore
            const resultB = await plugin.endpoints.check(ctxB);
            expect(resultB.balance).toBe(50);

            // Verify independence
            expect(resultA.balance).not.toBe(resultB.balance);
        });

        it("should not affect other users when tracking usage", async () => {
            // User Jack
            seedUsageRecord({
                entityType: "user",
                entityId: "user_jack",
                featureId: "team_members",
                balance: 5,
                limit: 5,
            });

            // User Kate
            seedUsageRecord({
                entityType: "user",
                entityId: "user_kate",
                featureId: "team_members",
                balance: 3,
                limit: 5,
            });

            // User Jack tracks usage
            const ctxJack = createMockCtx(mockAdapter, {
                userId: "user_jack",
                body: { feature: "team_members", delta: 2 },
            });

            // @ts-ignore
            const resultJack = await plugin.endpoints.track(ctxJack);
            expect(resultJack.balance).toBe(3);

            // Verify User Kate's balance unchanged
            const ctxKate = createMockCtx(mockAdapter, {
                userId: "user_kate",
                query: { feature: "team_members" },
            });

            // @ts-ignore
            const resultKate = await plugin.endpoints.check(ctxKate);
            expect(resultKate.balance).toBe(3); // Still 3, unchanged
        });
    });

    // ============================================================
    // User-Specific Edge Cases
    // ============================================================
    describe("User-Specific Edge Cases", () => {
        it("should handle user with no usage records (new user)", async () => {
            const ctx = createMockCtx(mockAdapter, {
                userId: "user_newbie",
                query: { feature: "storage" },
            });

            // @ts-ignore
            const result = await plugin.endpoints.check(ctx);

            expect(result.allowed).toBe(false);
        });

        it("should allow user to set plan without payment", async () => {
            const ctx = createMockCtx(mockAdapter, {
                userId: "user_leo",
                body: { planId: "personal_pro" },
            });

            // @ts-ignore
            const result = await plugin.endpoints.setplan(ctx);

            expect(result.success).toBe(true);
            expect(result.planId).toBe("personal_pro");

            const usageRecords = Object.values(mockDb.paymongoUsage);
            const userRecords = usageRecords.filter(
                (r) => r.entityType === "user" && r.entityId === "user_leo"
            );
            expect(userRecords.length).toBeGreaterThanOrEqual(1);
        });

        it("should handle user boolean feature check", async () => {
            seedUsageRecord({
                entityType: "user",
                entityId: "user_maya",
                featureId: "ai_features",
                balance: 1,
                limit: 1,
                planId: "personal_pro",
            });

            const ctx = createMockCtx(mockAdapter, {
                userId: "user_maya",
                query: { feature: "ai_features" },
            });

            // @ts-ignore
            const result = await plugin.endpoints.check(ctx);

            expect(result.allowed).toBe(true);
            expect(result.balance).toBeUndefined();
            expect(result.limit).toBeUndefined();
        });

        it("should reset user balance when period expires", async () => {
            const expiredPeriodEnd = new Date();
            expiredPeriodEnd.setMonth(expiredPeriodEnd.getMonth() - 1); // 1 month ago

            seedUsageRecord({
                entityType: "user",
                entityId: "user_nina",
                featureId: "storage",
                balance: 0, // All consumed
                limit: 100,
                periodEnd: expiredPeriodEnd,
            });

            const ctx = createMockCtx(mockAdapter, {
                userId: "user_nina",
                query: { feature: "storage" },
            });

            // @ts-ignore
            const result = await plugin.endpoints.check(ctx);

            expect(result.allowed).toBe(true);
            expect(result.balance).toBe(100); // Reset to limit
            expect(mockAdapter.update).toHaveBeenCalled();
        });
    });
});
