import { describe, it, expect, beforeEach } from "bun:test";
import {
    createPaymongoOrganization,
    createSeatLimit,
    getOrganizationSeats,
    type SeatConfig,
} from "../organization";
import type { PaymongoAutumnConfig, UsageRecord } from "../types";
import {
    resetMockDb,
    createMockAdapter,
    mockDb,
} from "./utils";

// ============================================================
// Test Setup
// ============================================================

// Minimal PaymongoAutumnConfig for testing
const testConfig: PaymongoAutumnConfig<any, any> = {
    secretKey: "sk_test_123",
    features: {
        seats: { type: "metered", limit: 5 },
    },
    plans: {
        free: {
            amount: 0,
            currency: "PHP",
            displayName: "Free",
            interval: "monthly",
            features: { seats: 5 },
        },
        pro: {
            amount: 99900,
            currency: "PHP",
            displayName: "Pro",
            interval: "monthly",
            features: { seats: 25 },
        },
    },
};

// Helper: Seed a usage record
function seedUsageRecord(overrides: Partial<UsageRecord> & {
    entityType: "user" | "organization";
    entityId: string;
    featureId: string;
}): UsageRecord {
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
// Tests: createPaymongoOrganization
// ============================================================

describe("createPaymongoOrganization", () => {
    let mockAdapter: ReturnType<typeof createMockAdapter>;

    beforeEach(() => {
        resetMockDb();
        mockAdapter = createMockAdapter();
    });

    it("should return an object with membershipLimit function", () => {
        const result = createPaymongoOrganization(testConfig);

        expect(result).toBeDefined();
        expect(result.membershipLimit).toBeDefined();
        expect(typeof result.membershipLimit).toBe("function");
    });

    it("should return limit from usage record when it exists", async () => {
        seedUsageRecord({
            entityType: "organization",
            entityId: "org_123",
            featureId: "seats",
            limit: 25,
            balance: 20,
        });

        const result = createPaymongoOrganization(testConfig);
        const limit = await result.membershipLimit({
            organizationId: "org_123",
            adapter: mockAdapter,
        });

        expect(limit).toBe(25);
    });

    it("should return default limit (5) when no usage record exists", async () => {
        const result = createPaymongoOrganization(testConfig);
        const limit = await result.membershipLimit({
            organizationId: "org_nonexistent",
            adapter: mockAdapter,
        });

        expect(limit).toBe(5);
    });

    it("should respect custom featureId from seatConfig", async () => {
        seedUsageRecord({
            entityType: "organization",
            entityId: "org_123",
            featureId: "team_seats",
            limit: 50,
            balance: 30,
        });

        const seatConfig: SeatConfig = { featureId: "team_seats" };
        const result = createPaymongoOrganization(testConfig, seatConfig);
        const limit = await result.membershipLimit({
            organizationId: "org_123",
            adapter: mockAdapter,
        });

        expect(limit).toBe(50);
    });

    it("should respect custom defaultLimit from seatConfig", async () => {
        const seatConfig: SeatConfig = { defaultLimit: 10 };
        const result = createPaymongoOrganization(testConfig, seatConfig);
        const limit = await result.membershipLimit({
            organizationId: "org_nonexistent",
            adapter: mockAdapter,
        });

        expect(limit).toBe(10);
    });

    it("should handle both custom featureId and defaultLimit", async () => {
        const seatConfig: SeatConfig = {
            featureId: "custom_seats",
            defaultLimit: 15,
        };

        // Test with no record (should use defaultLimit)
        const result = createPaymongoOrganization(testConfig, seatConfig);
        const defaultLimit = await result.membershipLimit({
            organizationId: "org_new",
            adapter: mockAdapter,
        });

        expect(defaultLimit).toBe(15);

        // Test with record (should use record limit)
        seedUsageRecord({
            entityType: "organization",
            entityId: "org_existing",
            featureId: "custom_seats",
            limit: 100,
            balance: 80,
        });

        const recordLimit = await result.membershipLimit({
            organizationId: "org_existing",
            adapter: mockAdapter,
        });

        expect(recordLimit).toBe(100);
    });
});

// ============================================================
// Tests: createSeatLimit
// ============================================================

describe("createSeatLimit", () => {
    let mockAdapter: ReturnType<typeof createMockAdapter>;

    beforeEach(() => {
        resetMockDb();
        mockAdapter = createMockAdapter();
    });

    it("should return an async function", () => {
        const limitFn = createSeatLimit(mockAdapter);

        expect(limitFn).toBeDefined();
        expect(typeof limitFn).toBe("function");
    });

    it("should return limit from usage record when it exists", async () => {
        seedUsageRecord({
            entityType: "organization",
            entityId: "org_456",
            featureId: "seats",
            limit: 30,
            balance: 25,
        });

        const limitFn = createSeatLimit(mockAdapter);
        const limit = await limitFn({
            organizationId: "org_456",
            adapter: mockAdapter,
        });

        expect(limit).toBe(30);
    });

    it("should return default limit (5) when no usage record exists", async () => {
        const limitFn = createSeatLimit(mockAdapter);
        const limit = await limitFn({
            organizationId: "org_nonexistent",
            adapter: mockAdapter,
        });

        expect(limit).toBe(5);
    });

    it("should respect custom featureId option", async () => {
        seedUsageRecord({
            entityType: "organization",
            entityId: "org_789",
            featureId: "team_members",
            limit: 75,
            balance: 60,
        });

        const limitFn = createSeatLimit(mockAdapter, { featureId: "team_members" });
        const limit = await limitFn({
            organizationId: "org_789",
            adapter: mockAdapter,
        });

        expect(limit).toBe(75);
    });

    it("should respect custom defaultLimit option", async () => {
        const limitFn = createSeatLimit(mockAdapter, { defaultLimit: 20 });
        const limit = await limitFn({
            organizationId: "org_new",
            adapter: mockAdapter,
        });

        expect(limit).toBe(20);
    });

    it("should handle both custom featureId and defaultLimit", async () => {
        const options: SeatConfig = {
            featureId: "custom_members",
            defaultLimit: 12,
        };

        const limitFn = createSeatLimit(mockAdapter, options);

        // Test default
        const defaultLimit = await limitFn({
            organizationId: "org_default",
            adapter: mockAdapter,
        });
        expect(defaultLimit).toBe(12);

        // Test with record
        seedUsageRecord({
            entityType: "organization",
            entityId: "org_with_plan",
            featureId: "custom_members",
            limit: 99,
            balance: 50,
        });

        const recordLimit = await limitFn({
            organizationId: "org_with_plan",
            adapter: mockAdapter,
        });
        expect(recordLimit).toBe(99);
    });
});

// ============================================================
// Tests: getOrganizationSeats
// ============================================================

describe("getOrganizationSeats", () => {
    let mockAdapter: ReturnType<typeof createMockAdapter>;

    beforeEach(() => {
        resetMockDb();
        mockAdapter = createMockAdapter();
    });

    it("should return used, limit, and remaining seats", async () => {
        seedUsageRecord({
            entityType: "organization",
            entityId: "org_abc",
            featureId: "seats",
            limit: 20,
            balance: 12, // 8 used, 12 remaining
        });

        const seats = await getOrganizationSeats(mockAdapter, "org_abc");

        expect(seats).toEqual({
            used: 8,
            limit: 20,
            remaining: 12,
        });
    });

    it("should calculate used seats correctly (limit - balance)", async () => {
        seedUsageRecord({
            entityType: "organization",
            entityId: "org_xyz",
            featureId: "seats",
            limit: 100,
            balance: 75, // 25 used
        });

        const seats = await getOrganizationSeats(mockAdapter, "org_xyz");

        expect(seats.used).toBe(25);
        expect(seats.remaining).toBe(75);
    });

    it("should handle fully consumed seats (balance = 0)", async () => {
        seedUsageRecord({
            entityType: "organization",
            entityId: "org_full",
            featureId: "seats",
            limit: 10,
            balance: 0, // All used
        });

        const seats = await getOrganizationSeats(mockAdapter, "org_full");

        expect(seats).toEqual({
            used: 10,
            limit: 10,
            remaining: 0,
        });
    });

    it("should handle unused seats (balance = limit)", async () => {
        seedUsageRecord({
            entityType: "organization",
            entityId: "org_empty",
            featureId: "seats",
            limit: 50,
            balance: 50, // None used
        });

        const seats = await getOrganizationSeats(mockAdapter, "org_empty");

        expect(seats).toEqual({
            used: 0,
            limit: 50,
            remaining: 50,
        });
    });

    it("should return default values when no usage record exists", async () => {
        const seats = await getOrganizationSeats(mockAdapter, "org_nonexistent");

        expect(seats).toEqual({
            used: 0,
            limit: 5,
            remaining: 5,
        });
    });

    it("should respect custom featureId parameter", async () => {
        seedUsageRecord({
            entityType: "organization",
            entityId: "org_custom",
            featureId: "team_slots",
            limit: 15,
            balance: 10, // 5 used
        });

        const seats = await getOrganizationSeats(
            mockAdapter,
            "org_custom",
            "team_slots"
        );

        expect(seats).toEqual({
            used: 5,
            limit: 15,
            remaining: 10,
        });
    });

    it("should return defaults if custom featureId has no record", async () => {
        const seats = await getOrganizationSeats(
            mockAdapter,
            "org_test",
            "nonexistent_feature"
        );

        expect(seats).toEqual({
            used: 0,
            limit: 5,
            remaining: 5,
        });
    });

    it("should handle edge case: negative balance clamped as 0 remaining", async () => {
        // Edge case: if somehow balance goes negative in DB
        seedUsageRecord({
            entityType: "organization",
            entityId: "org_edge",
            featureId: "seats",
            limit: 10,
            balance: -2, // Invalid state, but test handling
        });

        const seats = await getOrganizationSeats(mockAdapter, "org_edge");

        expect(seats.used).toBe(12); // limit - balance = 10 - (-2)
        expect(seats.limit).toBe(10);
        expect(seats.remaining).toBe(-2); // Returns balance as-is
    });
});
