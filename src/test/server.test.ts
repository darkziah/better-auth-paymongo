import { describe, it, expect, mock, beforeEach, afterAll } from "bun:test";
import { paymongo } from "../server";

const originalFetch = global.fetch;

describe("PayMongo Plugin", () => {
    const mockFetch = mock();
    global.fetch = mockFetch;

    // Mock adapter using the correct better-auth interface
    const mockUserData: Record<string, { id: string; paymongoData?: string | null }> = {
        "user_1": { id: "user_1", paymongoData: null }
    };

    const mockAdapter = {
        findOne: mock(async <T>(params: { model: string; where: { field: string; value: string }[] }): Promise<T | null> => {
            const id = params.where.find(w => w.field === "id")?.value;
            if (params.model === "user" && id && mockUserData[id]) {
                return mockUserData[id] as unknown as T;
            }
            if (params.model === "organization") {
                return { id: id, paymongoData: null } as unknown as T;
            }
            return null;
        }),
        update: mock(async <T>(params: { model: string; where: { field: string; value: string }[]; update: Record<string, unknown> }): Promise<T | null> => {
            const id = params.where.find(w => w.field === "id")?.value;
            if (params.model === "user" && id) {
                mockUserData[id] = { ...mockUserData[id], ...params.update } as any;
                return mockUserData[id] as unknown as T;
            }
            return null;
        })
    };

    const mockCtx = {
        context: {
            adapter: mockAdapter,
            session: { user: { id: "user_1" }, session: { id: "s1" } },
            options: { plugins: [] as any[] },
            logger: { error: console.error }
        },
        session: { user: { id: "user_1" }, session: { id: "s1" } },
        body: {},
        query: {},
        headers: new Headers()
    };

    const config = {
        secretKey: "sk_test",
        plans: {
            pro: {
                amount: 99900,
                currency: "PHP",
                displayName: "Pro",
                limits: { projects: 10 },
                interval: "month"
            },
            trial: {
                amount: 0,
                currency: "PHP",
                displayName: "Trial",
                limits: { projects: 5 },
                trialPeriodDays: 7
            }
        },
        addons: {
            seat: {
                amount: 10000,
                currency: "PHP",
                displayName: "Seat",
                type: "quantity",
                limitBonuses: { projects: 5 }
            }
        },
        defaults: {
            user: {
                planId: "trial"
            },
            org: {
                planId: "trial"
            }
        }
    };

    const plugin = paymongo(config as any);
    // @ts-ignore
    mockCtx.context.options.plugins.push({ id: "paymongo", _internal: { config } });

    beforeEach(() => {
        mockFetch.mockReset();
        mockAdapter.findOne.mockClear();
        mockAdapter.update.mockClear();
        // Reset user data
        mockUserData["user_1"] = { id: "user_1", paymongoData: null };
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    it("should create payment intent", async () => {
        // Only one fetch call now - payment intent creation (no price fetch needed)
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { id: 'pi_123', attributes: { client_key: 'ck_123' } } })
        });

        // @ts-ignore
        const res = await plugin.endpoints.createPaymentIntent({ ...mockCtx, body: { planId: "pro" } });

        expect(res.paymentIntentId).toBe("pi_123");
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should create subscription with payment", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { attributes: { status: 'succeeded' } } })
        });

        // @ts-ignore
        const res = await plugin.endpoints.createSubscription({ ...mockCtx, body: { planId: "pro", paymentIntentId: "pi_123" } });

        expect(res.status).toBe("active");
        expect(res.planId).toBe("pro");
        expect(mockAdapter.update).toHaveBeenCalled();
    });

    it("should create trial subscription", async () => {
        // @ts-ignore
        const res = await plugin.endpoints.createSubscription({ ...mockCtx, body: { planId: "trial" } });

        expect(res.status).toBe("trialing");
        expect(res.trialEndsAt).toBeDefined();
        expect(mockAdapter.update).toHaveBeenCalled();
    });

    it("should check usage correctly", async () => {
        // Set up user with subscription data
        mockUserData["user_1"] = {
            id: "user_1",
            paymongoData: JSON.stringify({
                planId: "pro",
                status: "active",
                usage: { projects: 2 },
                addons: { seat: 1 } // +5 projects
            })
        };

        // @ts-ignore
        const res = await plugin.endpoints.checkUsage({ ...mockCtx, query: { limitKey: "projects" } });

        expect(res.limit).toBe(15);
        expect(res.usage).toBe(2);
        expect(res.remaining).toBe(13);
        expect(res.allowed).toBe(true);
    });
});