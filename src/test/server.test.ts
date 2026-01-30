import { describe, it, expect, mock, beforeEach, afterAll, type Mock } from "bun:test";
import { paymongo } from "../server";
import type { PaymongoAutumnConfig, PlanConfig, FeatureConfig, UsageRecord } from "../types";
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
// Test Configuration (Valid PaymongoAutumnConfig)
// ============================================================
const testConfig: PaymongoAutumnConfig<
    Record<string, PlanConfig>,
    Record<string, FeatureConfig>
> = {
    secretKey: "sk_test_123",
    scopes: ["user", "organization"],
    features: {
        projects: { type: "metered", limit: 3 },
        api_access: { type: "boolean" },
        exports: { type: "metered", limit: 100 },
    },
    plans: {
        free: {
            amount: 0,
            currency: "PHP",
            displayName: "Free",
            interval: "monthly",
            features: { projects: 3, api_access: false, exports: 10 },
        },
        pro: {
            amount: 99900,
            currency: "PHP",
            displayName: "Pro",
            interval: "monthly",
            features: { projects: 100, api_access: true, exports: 1000 },
        },
        enterprise: {
            amount: 299900,
            currency: "PHP",
            displayName: "Enterprise",
            interval: "yearly",
            features: { projects: 1000, api_access: true, exports: 10000 },
        },
    },
};

// ============================================================
// Helper: Seed Usage Record
// ============================================================
function seedUsageRecord(
    overrides: Partial<UsageRecord> & {
        entityType: "user" | "organization";
        entityId: string;
        featureId: string;
    }
) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const record: UsageRecord = {
        id: `usage_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        entityType: overrides.entityType,
        entityId: overrides.entityId,
        featureId: overrides.featureId,
        balance: overrides.balance ?? 10,
        limit: overrides.limit ?? 10,
        periodStart: overrides.periodStart ?? now,
        periodEnd: overrides.periodEnd ?? periodEnd,
        planId: overrides.planId ?? "pro",
        checkoutSessionId: overrides.checkoutSessionId ?? "cs_123",
        createdAt: overrides.createdAt ?? now,
        updatedAt: overrides.updatedAt ?? now,
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
        planId: overrides.planId ?? "pro",
        status: overrides.status ?? "pending",
        createdAt: new Date(),
    };

    mockDb.paymongoSession[record.id] = record;
    return record;
}

// ============================================================
// Tests
// ============================================================
describe("PayMongo Autumn Plugin", () => {
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
    // /paymongo/attach Tests
    // ============================================================
    describe("POST /paymongo/attach", () => {
        it("should create a checkout session for a valid plan", async () => {
            mockFetch.mockResolvedValueOnce(
                createMockFetchResponse({
                    data: {
                        id: "cs_checkout_123",
                        attributes: {
                            checkout_url: "https://checkout.paymongo.com/cs_checkout_123",
                        },
                    },
                })
            );

            const ctx = createMockCtx(mockAdapter, {
                body: {
                    planId: "pro",
                    successUrl: "https://myapp.com/success",
                    cancelUrl: "https://myapp.com/cancel",
                },
            });

            // @ts-ignore - endpoint context type mismatch
            const result = await plugin.endpoints.attach(ctx);

            expect(result.checkoutUrl).toBe("https://checkout.paymongo.com/cs_checkout_123");
            expect(result.sessionId).toBe("cs_checkout_123");
            expect(mockAdapter.create).toHaveBeenCalledTimes(1);

            // Verify session was stored
            const sessions = Object.values(mockDb.paymongoSession);
            expect(sessions.length).toBe(1);
            expect(sessions[0].status).toBe("pending");
            expect(sessions[0].planId).toBe("pro");
        });

        it("should include reference ID in success URL", async () => {
            let capturedBody: any;
            mockFetch.mockImplementationOnce(async (_url, options) => {
                capturedBody = JSON.parse(options?.body as string);
                return createMockFetchResponse({
                    data: {
                        id: "cs_123",
                        attributes: { checkout_url: "https://checkout.paymongo.com/cs_123" },
                    },
                });
            });

            const ctx = createMockCtx(mockAdapter, {
                body: {
                    planId: "pro",
                    successUrl: "https://myapp.com/success",
                    cancelUrl: "https://myapp.com/cancel",
                },
            });

            // @ts-ignore
            await plugin.endpoints.attach(ctx);

            expect(capturedBody.data.attributes.reference_number).toMatch(/^ref_/);
            expect(capturedBody.data.attributes.success_url).toContain("ref=");
        });

        it("should handle organization-scoped checkout", async () => {
            mockFetch.mockResolvedValueOnce(
                createMockFetchResponse({
                    data: {
                        id: "cs_org_123",
                        attributes: { checkout_url: "https://checkout.paymongo.com/cs_org_123" },
                    },
                })
            );

            const ctx = createMockCtx(mockAdapter, {
                body: {
                    planId: "pro",
                    successUrl: "https://myapp.com/success",
                    cancelUrl: "https://myapp.com/cancel",
                    organizationId: "org_456",
                },
            });

            // @ts-ignore
            await plugin.endpoints.attach(ctx);

            const sessions = Object.values(mockDb.paymongoSession);
            expect(sessions[0].entityType).toBe("organization");
            expect(sessions[0].entityId).toBe("org_456");
        });

        it("should throw error for invalid plan", async () => {
            const ctx = createMockCtx(mockAdapter, {
                body: {
                    planId: "nonexistent",
                    successUrl: "https://myapp.com/success",
                    cancelUrl: "https://myapp.com/cancel",
                },
            });

            // @ts-ignore
            await expect(plugin.endpoints.attach(ctx)).rejects.toThrow(
                "Plan nonexistent not found"
            );
        });

        it("should throw error when PayMongo API fails", async () => {
            mockFetch.mockResolvedValueOnce(
                createMockFetchResponse({ error: "Invalid API key" }, false)
            );

            const ctx = createMockCtx(mockAdapter, {
                body: {
                    planId: "pro",
                    successUrl: "https://myapp.com/success",
                    cancelUrl: "https://myapp.com/cancel",
                },
            });

            // @ts-ignore
            await expect(plugin.endpoints.attach(ctx)).rejects.toThrow("PayMongo API error");
        });
    });

    // ============================================================
    // /paymongo/verify Tests
    // ============================================================
    describe("POST /paymongo/verify", () => {
        it("should verify payment and create usage records", async () => {
            const session = seedPaymongoSession({
                referenceId: "ref_test_123",
                planId: "pro",
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
                body: { ref: "ref_test_123" },
            });

            // @ts-ignore
            const result = await plugin.endpoints.verify(ctx);

            expect(result.success).toBe(true);
            expect(result.planId).toBe("pro");

            // Verify usage records were created for metered features
            const usageRecords = Object.values(mockDb.paymongoUsage);
            expect(usageRecords.length).toBeGreaterThanOrEqual(1);

            const projectsUsage = usageRecords.find((r) => r.featureId === "projects");
            expect(projectsUsage).toBeDefined();
            expect(projectsUsage?.limit).toBe(100); // Pro plan limit
            expect(projectsUsage?.balance).toBe(100);
        });

        it("should return success for already completed session", async () => {
            seedPaymongoSession({
                referenceId: "ref_completed",
                planId: "pro",
                status: "completed",
            });

            const ctx = createMockCtx(mockAdapter, {
                body: { ref: "ref_completed" },
            });

            // @ts-ignore
            const result = await plugin.endpoints.verify(ctx);

            expect(result.success).toBe(true);
            expect(mockFetch).not.toHaveBeenCalled(); // Should not call PayMongo API
        });

        it("should throw error for non-existent session", async () => {
            const ctx = createMockCtx(mockAdapter, {
                body: { ref: "ref_nonexistent" },
            });

            // @ts-ignore
            await expect(plugin.endpoints.verify(ctx)).rejects.toThrow(
                "Session not found for ref"
            );
        });

        it("should throw error for unpaid session", async () => {
            seedPaymongoSession({
                referenceId: "ref_unpaid",
                status: "pending",
            });

            mockFetch.mockResolvedValueOnce(
                createMockFetchResponse({
                    data: { attributes: { payment_status: "pending" } },
                })
            );

            const ctx = createMockCtx(mockAdapter, {
                body: { ref: "ref_unpaid" },
            });

            // @ts-ignore
            await expect(plugin.endpoints.verify(ctx)).rejects.toThrow(
                "Payment not completed"
            );
        });

        it("should carry over consumed usage when upgrading plans", async () => {
            // Seed existing usage (user consumed 2 of 3 projects on free plan)
            seedUsageRecord({
                entityType: "user",
                entityId: "user_123",
                featureId: "projects",
                balance: 1, // 2 consumed
                limit: 3,
                planId: "free",
            });

            const session = seedPaymongoSession({
                referenceId: "ref_upgrade",
                planId: "pro", // Upgrading to pro
                entityId: "user_123",
            });

            mockFetch.mockResolvedValueOnce(
                createMockFetchResponse({
                    data: { attributes: { payment_status: "paid" } },
                })
            );

            const ctx = createMockCtx(mockAdapter, {
                body: { ref: "ref_upgrade" },
            });

            // @ts-ignore
            await plugin.endpoints.verify(ctx);

            // Find the new projects usage record
            const usageRecords = Object.values(mockDb.paymongoUsage);
            const projectsUsage = usageRecords.find((r) => r.featureId === "projects");

            // Pro plan has 100 limit, user consumed 2, so balance should be 98
            expect(projectsUsage?.limit).toBe(100);
            expect(projectsUsage?.balance).toBe(98);
        });
    });

    // ============================================================
    // /paymongo/check Tests
    // ============================================================
    describe("GET /paymongo/check", () => {
        it("should return allowed=true with balance for metered feature", async () => {
            seedUsageRecord({
                entityType: "user",
                entityId: "user_123",
                featureId: "projects",
                balance: 5,
                limit: 10,
            });

            const ctx = createMockCtx(mockAdapter, {
                query: { feature: "projects" },
            });

            // @ts-ignore
            const result = await plugin.endpoints.check(ctx);

            expect(result.allowed).toBe(true);
            expect(result.balance).toBe(5);
            expect(result.limit).toBe(10);
        });

        it("should return allowed=false when balance is 0", async () => {
            seedUsageRecord({
                entityType: "user",
                entityId: "user_123",
                featureId: "projects",
                balance: 0,
                limit: 10,
            });

            const ctx = createMockCtx(mockAdapter, {
                query: { feature: "projects" },
            });

            // @ts-ignore
            const result = await plugin.endpoints.check(ctx);

            expect(result.allowed).toBe(false);
            expect(result.balance).toBe(0);
        });

        it("should return allowed=false when no usage record exists", async () => {
            const ctx = createMockCtx(mockAdapter, {
                query: { feature: "projects" },
            });

            // @ts-ignore
            const result = await plugin.endpoints.check(ctx);

            expect(result.allowed).toBe(false);
        });

        it("should auto-reset balance when period has expired", async () => {
            const expiredPeriodEnd = new Date();
            expiredPeriodEnd.setMonth(expiredPeriodEnd.getMonth() - 1); // 1 month ago

            seedUsageRecord({
                entityType: "user",
                entityId: "user_123",
                featureId: "projects",
                balance: 0, // All consumed
                limit: 10,
                periodEnd: expiredPeriodEnd,
            });

            const ctx = createMockCtx(mockAdapter, {
                query: { feature: "projects" },
            });

            // @ts-ignore
            const result = await plugin.endpoints.check(ctx);

            // Balance should be reset to limit
            expect(result.allowed).toBe(true);
            expect(result.balance).toBe(10);

            // Verify adapter.update was called with new period
            expect(mockAdapter.update).toHaveBeenCalled();
        });

        it("should check organization-scoped usage", async () => {
            seedUsageRecord({
                entityType: "organization",
                entityId: "org_456",
                featureId: "projects",
                balance: 50,
                limit: 100,
            });

            const ctx = createMockCtx(mockAdapter, {
                query: { feature: "projects", organizationId: "org_456" },
            });

            // @ts-ignore
            const result = await plugin.endpoints.check(ctx);

            expect(result.allowed).toBe(true);
            expect(result.balance).toBe(50);
        });
    });

    // ============================================================
    // /paymongo/track Tests
    // ============================================================
    describe("POST /paymongo/track", () => {
        it("should decrement balance by default delta (1)", async () => {
            seedUsageRecord({
                entityType: "user",
                entityId: "user_123",
                featureId: "projects",
                balance: 10,
                limit: 10,
            });

            const ctx = createMockCtx(mockAdapter, {
                body: { feature: "projects" },
            });

            // @ts-ignore
            const result = await plugin.endpoints.track(ctx);

            expect(result.success).toBe(true);
            expect(result.balance).toBe(9);
            expect(result.limit).toBe(10);
        });

        it("should decrement balance by custom delta", async () => {
            seedUsageRecord({
                entityType: "user",
                entityId: "user_123",
                featureId: "exports",
                balance: 100,
                limit: 100,
            });

            const ctx = createMockCtx(mockAdapter, {
                body: { feature: "exports", delta: 5 },
            });

            // @ts-ignore
            const result = await plugin.endpoints.track(ctx);

            expect(result.balance).toBe(95);
        });

        it("should not allow balance to go below 0", async () => {
            seedUsageRecord({
                entityType: "user",
                entityId: "user_123",
                featureId: "projects",
                balance: 2,
                limit: 10,
            });

            const ctx = createMockCtx(mockAdapter, {
                body: { feature: "projects", delta: 5 },
            });

            // @ts-ignore
            const result = await plugin.endpoints.track(ctx);

            expect(result.balance).toBe(0); // Should clamp to 0
        });

        it("should throw error when no usage record exists", async () => {
            const ctx = createMockCtx(mockAdapter, {
                body: { feature: "nonexistent" },
            });

            // @ts-ignore
            await expect(plugin.endpoints.track(ctx)).rejects.toThrow(
                "No usage record found"
            );
        });

        it("should track organization-scoped usage", async () => {
            seedUsageRecord({
                entityType: "organization",
                entityId: "org_456",
                featureId: "projects",
                balance: 50,
                limit: 100,
            });

            const ctx = createMockCtx(mockAdapter, {
                body: { feature: "projects", organizationId: "org_456" },
            });

            // @ts-ignore
            const result = await plugin.endpoints.track(ctx);

            expect(result.balance).toBe(49);
        });
    });

    // ============================================================
    // /paymongo/set-plan Tests
    // ============================================================
    describe("POST /paymongo/set-plan", () => {
        it("should set plan and create usage records without payment", async () => {
            const ctx = createMockCtx(mockAdapter, {
                body: { planId: "pro" },
            });

            // @ts-ignore
            const result = await plugin.endpoints.setplan(ctx);

            expect(result.success).toBe(true);
            expect(result.planId).toBe("pro");

            // Verify usage records were created
            const usageRecords = Object.values(mockDb.paymongoUsage);
            expect(usageRecords.length).toBeGreaterThanOrEqual(1);

            const projectsUsage = usageRecords.find((r) => r.featureId === "projects");
            expect(projectsUsage?.limit).toBe(100);
            expect(projectsUsage?.balance).toBe(100);
        });

        it("should replace existing usage records when changing plans", async () => {
            // Seed existing free plan usage
            seedUsageRecord({
                entityType: "user",
                entityId: "user_123",
                featureId: "projects",
                balance: 1,
                limit: 3,
                planId: "free",
            });

            const ctx = createMockCtx(mockAdapter, {
                body: { planId: "pro" },
            });

            // @ts-ignore
            await plugin.endpoints.setplan(ctx);

            // Should only have pro plan records, old records deleted
            const usageRecords = Object.values(mockDb.paymongoUsage);
            const projectsRecords = usageRecords.filter((r) => r.featureId === "projects");
            expect(projectsRecords.length).toBe(1);
            expect(projectsRecords[0].planId).toBe("pro");
            expect(projectsRecords[0].limit).toBe(100);
        });

        it("should throw error for invalid plan", async () => {
            const ctx = createMockCtx(mockAdapter, {
                body: { planId: "invalid" },
            });

            // @ts-ignore
            await expect(plugin.endpoints.setplan(ctx)).rejects.toThrow(
                "Plan invalid not found"
            );
        });

        it("should set organization-scoped plan", async () => {
            const ctx = createMockCtx(mockAdapter, {
                body: { planId: "enterprise", organizationId: "org_789" },
            });

            // @ts-ignore
            const result = await plugin.endpoints.setplan(ctx);

            expect(result.success).toBe(true);

            const usageRecords = Object.values(mockDb.paymongoUsage);
            expect(usageRecords[0].entityType).toBe("organization");
            expect(usageRecords[0].entityId).toBe("org_789");
        });
    });

    // ============================================================
    // Plugin Schema Tests
    // ============================================================
    describe("Plugin Schema", () => {
        it("should define paymongoUsage schema", () => {
            expect(plugin.schema?.paymongoUsage).toBeDefined();
            expect(plugin.schema?.paymongoUsage.fields.entityType).toBeDefined();
            expect(plugin.schema?.paymongoUsage.fields.balance).toBeDefined();
            expect(plugin.schema?.paymongoUsage.fields.limit).toBeDefined();
        });

        it("should define paymongoSession schema", () => {
            expect(plugin.schema?.paymongoSession).toBeDefined();
            expect(plugin.schema?.paymongoSession.fields.sessionId).toBeDefined();
            expect(plugin.schema?.paymongoSession.fields.referenceId).toBeDefined();
            expect(plugin.schema?.paymongoSession.fields.status).toBeDefined();
        });
    });
});
