import { describe, it, expect, mock, beforeEach, afterAll } from "bun:test";
import { paymongo } from "../server";

const originalFetch = global.fetch;

describe("PayMongo Plugin", () => {
    const mockFetch = mock();
    global.fetch = mockFetch;

    const mockAdapter = {
        updateUser: mock(async () => { }),
        updateOrganization: mock(async () => { }),
        findUser: mock(async () => ({ id: "user_1", paymongoData: null })),
        findOrganization: mock(async () => ({ id: "org_1", paymongoData: null }))
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
                priceId: "price_pro",
                displayName: "Pro",
                limits: { projects: 10 },
                interval: "month"
            },
            trial: {
                priceId: "price_trial",
                displayName: "Trial",
                limits: { projects: 5 },
                trialPeriodDays: 7
            }
        },
        addons: {
            seat: {
                priceId: "price_seat",
                displayName: "Seat",
                type: "quantity",
                limitBonuses: { projects: 5 }
            }
        }
    };

    const plugin = paymongo(config as any);
    // @ts-ignore
    mockCtx.context.options.plugins.push({ id: "paymongo", _internal: { config } });

    beforeEach(() => {
        mockFetch.mockReset();
        mockAdapter.updateUser.mockReset();
        mockAdapter.findUser.mockReset();
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    it("should create payment intent", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { attributes: { unit_amount: 1000, currency: 'PHP' } } })
        });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { id: 'pi_123', attributes: { client_key: 'ck_123' } } })
        });

        // @ts-ignore
        const res = await plugin.endpoints.createPaymentIntent({ ...mockCtx, body: { planId: "pro" } });

        expect(res.paymentIntentId).toBe("pi_123");
        expect(mockFetch).toHaveBeenCalledTimes(2);
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
        expect(mockAdapter.updateUser).toHaveBeenCalled();
        const updateArg = mockAdapter.updateUser.mock.calls[0][1];
        expect(updateArg.paymongoData).toContain("active");
    });

    it("should create trial subscription", async () => {
        // @ts-ignore
        const res = await plugin.endpoints.createSubscription({ ...mockCtx, body: { planId: "trial" } });

        expect(res.status).toBe("trialing");
        expect(res.trialEndsAt).toBeDefined();
        expect(mockAdapter.updateUser).toHaveBeenCalled();
    });

    it("should check usage correctly", async () => {
        mockAdapter.findUser.mockResolvedValueOnce({
            id: "user_1",
            paymongoData: JSON.stringify({
                planId: "pro",
                status: "active",
                usage: { projects: 2 },
                addons: { seat: 1 } // +5 projects
            })
        });

        // @ts-ignore
        const res = await plugin.endpoints.checkUsage({ ...mockCtx, query: { limitKey: "projects" } });

        expect(res.limit).toBe(15);
        expect(res.usage).toBe(2);
        expect(res.remaining).toBe(13);
        expect(res.allowed).toBe(true);
    });
});